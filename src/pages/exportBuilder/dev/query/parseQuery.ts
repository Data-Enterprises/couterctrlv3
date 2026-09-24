import { AGGREGATE_FNS, type AggregateFn } from "../aggregates";
import {
  EXPORT_CALLS,
  type ExportCall,
  type ExportExpr,
} from "../../../../api/salesExport";

/**
 * A small SQL, parsed here.
 *
 * SELECT, WHERE, GROUP BY, ORDER BY and LIMIT over the sample rows the preview
 * returned — enough to check an idea before spending twenty minutes building a
 * file, and no more. It runs in the browser: nothing typed here is sent
 * anywhere, and nothing here writes the export. The export is still built from
 * the configuration on the left.
 *
 * Anything outside the subset is refused by name rather than guessed at. A
 * window function that silently does the wrong thing is worse than one that
 * says it is not supported.
 */

export type Literal = string | number | boolean | null;

/**
 * A value in the SELECT list.
 *
 * An expression rather than a column, because the useful queries are
 * expressions: `sum(qty) * (max(price) / nullif(max(price_split), 0))` is one
 * output column, and a window that only understood `sum(qty)` would be a toy.
 * Aggregates are leaves of the tree — the arithmetic happens after they have
 * been worked out for the group, as it does in SQL.
 *
 * This is the export endpoint's `computed` shape, deliberately: a tree parsed
 * here is a tree that can be sent, so a query that ran in this window becomes
 * a file without anything being translated in between.
 */
export type ValueExpr = ExportExpr;

export const CALL_NAMES = EXPORT_CALLS;
export type CallName = ExportCall;

export interface SelectItem {
  expr: ValueExpr;
  /** What the result column is called. */
  alias: string;
}

/** Every aggregate in the tree, which is what has to be worked out per group. */
export const aggLeaves = (expr: ValueExpr): { fn: AggregateFn; column: string }[] => {
  switch (expr.kind) {
    case "agg":
      return [{ fn: expr.fn, column: expr.column }];
    case "binary":
      return [...aggLeaves(expr.left), ...aggLeaves(expr.right)];
    case "neg":
      return aggLeaves(expr.expr);
    case "call":
      return expr.args.flatMap(aggLeaves);
    default:
      return [];
  }
};

/** Columns referred to outside an aggregate, which have to be grouped by. */
export const bareColumns = (expr: ValueExpr): string[] => {
  switch (expr.kind) {
    case "column":
      return [expr.name];
    case "binary":
      return [...bareColumns(expr.left), ...bareColumns(expr.right)];
    case "neg":
      return bareColumns(expr.expr);
    case "call":
      return expr.args.flatMap(bareColumns);
    default:
      return [];
  }
};

/** Every column the query touches, aggregated or not. */
export const allColumns = (expr: ValueExpr): string[] => [
  ...bareColumns(expr),
  ...aggLeaves(expr)
    .map((a) => a.column)
    .filter((c) => c !== "*"),
];

export type Comparison =
  | { kind: "cmp"; column: string; op: CmpOp; value: Literal }
  | { kind: "null"; column: string; negated: boolean }
  | { kind: "in"; column: string; values: Literal[]; negated: boolean }
  | {
      kind: "like";
      column: string;
      pattern: string;
      negated: boolean;
      insensitive: boolean;
    }
  | { kind: "between"; column: string; low: Literal; high: Literal; negated: boolean };

export type CmpOp = "=" | "!=" | "<" | "<=" | ">" | ">=";

export type Expr =
  | Comparison
  | { kind: "and"; left: Expr; right: Expr }
  | { kind: "or"; left: Expr; right: Expr }
  | { kind: "not"; expr: Expr };

export interface Query {
  /** Empty when the query is `SELECT *`. */
  select: SelectItem[];
  star: boolean;
  where: Expr | null;
  groupBy: string[];
  /** A key is an output name or a 1-based position, as SQL allows both. */
  orderBy: { key: string | number; desc: boolean }[];
  limit: number | null;
}

export class QueryError extends Error {
  hint?: string;
  constructor(message: string, hint?: string) {
    super(message);
    this.name = "QueryError";
    this.hint = hint;
  }
}

interface Token {
  type: "word" | "number" | "string" | "op";
  /** Folded to lower case for a word, as Postgres folds an unquoted name. */
  text: string;
  /** For a word: the upper-cased text, for keyword matching. */
  upper: string;
  /**
   * Exactly what was typed.
   *
   * Only aliases use it. An unquoted column name is folded because that is
   * what Postgres does to find the column — but an alias is not looked up,
   * it is written, and the export quotes it. So `AS TotalUnits` can be
   * TotalUnits in the file's header rather than totalunits, which is what
   * whoever typed it meant.
   */
  raw: string;
}

const OPERATORS = [
  "<=",
  ">=",
  "<>",
  "!=",
  "=",
  "<",
  ">",
  "(",
  ")",
  ",",
  "*",
  "/",
  "+",
  "-",
  ";",
];

const tokenize = (sql: string): Token[] => {
  const tokens: Token[] = [];
  let i = 0;
  while (i < sql.length) {
    const ch = sql[i];
    if (/\s/.test(ch)) {
      i += 1;
      continue;
    }
    // A line comment is a normal thing to leave in a scratchpad.
    if (ch === "-" && sql[i + 1] === "-") {
      while (i < sql.length && sql[i] !== "\n") i += 1;
      continue;
    }
    if (ch === "'") {
      let value = "";
      i += 1;
      while (i < sql.length) {
        if (sql[i] === "'") {
          // '' is an escaped quote, as in SQL.
          if (sql[i + 1] === "'") {
            value += "'";
            i += 2;
            continue;
          }
          break;
        }
        value += sql[i];
        i += 1;
      }
      if (i >= sql.length) {
        throw new QueryError("A quoted value is missing its closing '.");
      }
      i += 1;
      tokens.push({ type: "string", text: value, upper: value, raw: value });
      continue;
    }
    if (ch === '"') {
      let value = "";
      i += 1;
      while (i < sql.length && sql[i] !== '"') {
        value += sql[i];
        i += 1;
      }
      if (i >= sql.length) {
        throw new QueryError('A quoted name is missing its closing ".');
      }
      i += 1;
      // Quoted identifiers keep their case, as in Postgres.
      tokens.push({
        type: "word",
        text: value,
        upper: value.toUpperCase(),
        raw: value,
      });
      continue;
    }
    if (/[0-9]/.test(ch) || (ch === "." && /[0-9]/.test(sql[i + 1] ?? ""))) {
      let value = "";
      while (i < sql.length && /[0-9.]/.test(sql[i])) {
        value += sql[i];
        i += 1;
      }
      tokens.push({ type: "number", text: value, upper: value, raw: value });
      continue;
    }
    if (/[A-Za-z_]/.test(ch)) {
      let value = "";
      while (i < sql.length && /[A-Za-z0-9_$]/.test(sql[i])) {
        value += sql[i];
        i += 1;
      }
      // Unquoted names fold to lower case, as Postgres folds them, and every
      // column of this table is lower case.
      tokens.push({
        type: "word",
        text: value.toLowerCase(),
        upper: value.toUpperCase(),
        raw: value,
      });
      continue;
    }
    const op = OPERATORS.find((o) => sql.startsWith(o, i));
    if (!op) {
      throw new QueryError(`I do not know what to do with "${ch}".`);
    }
    i += op.length;
    tokens.push({
      type: "op",
      text: op === "<>" ? "!=" : op,
      upper: op,
      raw: op,
    });
  }
  return tokens;
};

const FN_NAMES = new Set<string>(AGGREGATE_FNS);

/** The keywords that end a clause, so a list knows where to stop. */
const CLAUSE_WORDS = new Set([
  "FROM",
  "WHERE",
  "GROUP",
  "ORDER",
  "LIMIT",
  "HAVING",
  "OFFSET",
]);

const NOT_SUPPORTED: Record<string, string> = {
  JOIN: "joins",
  INNER: "joins",
  LEFT: "joins",
  RIGHT: "joins",
  UNION: "UNION",
  HAVING: "HAVING",
  OVER: "window functions",
  CASE: "CASE",
  WITH: "common table expressions",
  INSERT: "anything that writes",
  UPDATE: "anything that writes",
  DELETE: "anything that writes",
  DROP: "anything that writes",
};

export const parseQuery = (sql: string): Query => {
  const tokens = tokenize(sql);
  if (tokens.length === 0) throw new QueryError("There is nothing to run yet.");

  for (const token of tokens) {
    const what = token.type === "word" ? NOT_SUPPORTED[token.upper] : undefined;
    if (what) {
      throw new QueryError(
        `This window does not do ${what}.`,
        "It runs the sample rows through SELECT, WHERE, GROUP BY, ORDER BY and LIMIT — enough to check an idea, not a second database.",
      );
    }
  }

  let at = 0;
  const peek = () => tokens[at];
  const done = () => at >= tokens.length;
  const isWord = (word: string) =>
    !done() && peek().type === "word" && peek().upper === word;
  const isOp = (op: string) => !done() && peek().type === "op" && peek().text === op;
  const take = () => tokens[at++];
  const expectWord = (word: string) => {
    if (!isWord(word)) {
      throw new QueryError(`Expected ${word} here.`);
    }
    return take();
  };
  const expectOp = (op: string) => {
    if (!isOp(op)) throw new QueryError(`Expected ${op} here.`);
    return take();
  };

  const literal = (): Literal => {
    if (done()) throw new QueryError("A value is missing.");
    const token = take();
    if (token.type === "number") return Number(token.text);
    if (token.type === "string") return token.text;
    if (token.type === "word") {
      if (token.upper === "NULL") return null;
      if (token.upper === "TRUE") return true;
      if (token.upper === "FALSE") return false;
      // A bare word where a value belongs is nearly always a missing quote.
      throw new QueryError(
        `${token.text} is a name, not a value.`,
        `Text values go in single quotes: ${token.text} should be '${token.text}'.`,
      );
    }
    throw new QueryError("A value is missing.");
  };

  const columnName = (what: string) => {
    if (done() || peek().type !== "word") {
      throw new QueryError(`Expected a column name ${what}.`);
    }
    return take().text;
  };

  // --- SELECT --------------------------------------------------------------
  if (!isWord("SELECT")) {
    throw new QueryError(
      "A query starts with SELECT.",
      "For example: select storeid, sum(total_sales) from sample group by storeid",
    );
  }
  take();

  const select: SelectItem[] = [];
  let star = false;

  /** A call to one of the six aggregates, which is a leaf of an expression. */
  const aggregateCall = (name: string): ValueExpr => {
    expectOp("(");
    let fn = name as AggregateFn;
    if (isWord("DISTINCT")) {
      take();
      if (fn !== "count") throw new QueryError("DISTINCT only goes inside count().");
      fn = "count_distinct";
    }
    let column: string;
    if (isOp("*")) {
      take();
      if (fn !== "count") throw new QueryError(`${name}(*) is only a thing for count.`);
      column = "*";
    } else {
      column = columnName(`inside ${name}()`);
      if (!isOp(")")) {
        throw new QueryError(
          `${name}() here takes a single column.`,
          "Arithmetic goes outside the brackets: sum(qty) * max(price), not sum(qty * price).",
        );
      }
    }
    expectOp(")");
    return { kind: "agg", fn, column };
  };

  const primary = (): ValueExpr => {
    if (isOp("(")) {
      take();
      const inner = valueExpr();
      expectOp(")");
      return inner;
    }
    if (isOp("-")) {
      take();
      return { kind: "neg", expr: primary() };
    }
    if (done()) throw new QueryError("Something is missing from the SELECT list.");
    const token = peek();
    if (token.type === "number") {
      take();
      return { kind: "literal", value: Number(token.text) };
    }
    if (token.type === "string") {
      take();
      return { kind: "literal", value: token.text };
    }
    if (token.type !== "word") {
      throw new QueryError(`I did not expect "${token.text}" in the SELECT list.`);
    }
    const name = take().text;
    if (isOp("(")) {
      if (FN_NAMES.has(name)) return aggregateCall(name);
      if ((CALL_NAMES as readonly string[]).includes(name)) {
        take();
        const args: ValueExpr[] = [valueExpr()];
        while (isOp(",")) {
          take();
          args.push(valueExpr());
        }
        expectOp(")");
        return { kind: "call", name: name as CallName, args };
      }
      throw new QueryError(
        `${name}() is not one of the functions this window runs.`,
        `Aggregates: ${AGGREGATE_FNS.join(", ")}. Others: ${CALL_NAMES.join(", ")}.`,
      );
    }
    if (FN_NAMES.has(name)) {
      throw new QueryError(
        `${name} is a function; it needs a column in brackets.`,
        `For example: ${name}(total_sales)`,
      );
    }
    if (name === "null") return { kind: "literal", value: null };
    if (name === "true") return { kind: "literal", value: true };
    if (name === "false") return { kind: "literal", value: false };
    return { kind: "column", name };
  };

  const multiplicative = (): ValueExpr => {
    let left = primary();
    while (isOp("*") || isOp("/")) {
      const op = take().text as "*" | "/";
      left = { kind: "binary", op, left, right: primary() };
    }
    return left;
  };

  function valueExpr(): ValueExpr {
    let left = multiplicative();
    while (isOp("+") || isOp("-")) {
      const op = take().text as "+" | "-";
      left = { kind: "binary", op, left, right: multiplicative() };
    }
    return left;
  }

  /** Where one SELECT item stops: a comma, or the next clause. */
  const isSelectBreak = (token: Token) =>
    (token.type === "op" && (token.text === "," || token.text === ";")) ||
    (token.type === "word" && CLAUSE_WORDS.has(token.upper));

  let unnamed = 0;
  const selectItem = (): SelectItem => {
    // A lone * is the whole row. Inside an expression it is a multiplication,
    // which the parser above deals with.
    if (isOp("*") && (tokens[at + 1] === undefined || isSelectBreak(tokens[at + 1]))) {
      take();
      star = true;
      return { expr: { kind: "column", name: "*" }, alias: "*" };
    }

    const expr = valueExpr();
    let alias =
      expr.kind === "column"
        ? expr.name
        : expr.kind === "agg"
          ? defaultAlias(expr.column, expr.fn)
          : `expr_${++unnamed}`;
    if (isWord("AS")) {
      take();
      if (done() || peek().type !== "word") {
        throw new QueryError("AS needs a name after it.");
      }
      alias = take().raw;
    } else if (!done() && peek().type === "word" && !CLAUSE_WORDS.has(peek().upper)) {
      // `sum(total_sales) total` — SQL allows the AS to be left out.
      alias = take().raw;
    }
    return { expr, alias };
  };

  select.push(selectItem());
  while (isOp(",")) {
    take();
    select.push(selectItem());
  }

  if (star && select.length > 1) {
    throw new QueryError("SELECT * takes the whole row, so it goes on its own.");
  }

  // --- FROM (optional, and there is only one thing to select from) ---------
  if (isWord("FROM")) {
    take();
    const source = columnName("after FROM");
    if (!["sample", "lines", "sales", "export"].includes(source)) {
      throw new QueryError(
        `There is only one table here, the sample rows — "${source}" is not it.`,
        "Leave FROM out, or write FROM sample.",
      );
    }
  }

  // --- WHERE ---------------------------------------------------------------
  const comparison = (): Expr => {
    if (isOp("(")) {
      take();
      const inner = orExpr();
      expectOp(")");
      return inner;
    }
    if (isWord("NOT")) {
      take();
      return { kind: "not", expr: comparison() };
    }

    const column = columnName("in the WHERE");

    if (isWord("IS")) {
      take();
      const negated = isWord("NOT") ? (take(), true) : false;
      expectWord("NULL");
      return { kind: "null", column, negated };
    }

    const negated = isWord("NOT") ? (take(), true) : false;

    if (isWord("IN")) {
      take();
      expectOp("(");
      const values: Literal[] = [literal()];
      while (isOp(",")) {
        take();
        values.push(literal());
      }
      expectOp(")");
      return { kind: "in", column, values, negated };
    }
    if (isWord("LIKE") || isWord("ILIKE")) {
      const insensitive = peek().upper === "ILIKE";
      take();
      const pattern = literal();
      if (typeof pattern !== "string") {
        throw new QueryError("LIKE takes a quoted pattern, such as '%MILK%'.");
      }
      return { kind: "like", column, pattern, negated, insensitive };
    }
    if (isWord("BETWEEN")) {
      take();
      const low = literal();
      expectWord("AND");
      const high = literal();
      return { kind: "between", column, low, high, negated };
    }
    if (negated) {
      throw new QueryError("NOT here has to be followed by IN, LIKE or BETWEEN.");
    }

    if (done() || peek().type !== "op") {
      throw new QueryError(`Expected a comparison after ${column}.`);
    }
    const op = take().text;
    if (!["=", "!=", "<", "<=", ">", ">="].includes(op)) {
      throw new QueryError(`${op} is not a comparison this window knows.`);
    }
    return { kind: "cmp", column, op: op as CmpOp, value: literal() };
  };

  const andExpr = (): Expr => {
    let left = comparison();
    while (isWord("AND")) {
      take();
      left = { kind: "and", left, right: comparison() };
    }
    return left;
  };

  function orExpr(): Expr {
    let left = andExpr();
    while (isWord("OR")) {
      take();
      left = { kind: "or", left, right: andExpr() };
    }
    return left;
  }

  let where: Expr | null = null;
  if (isWord("WHERE")) {
    take();
    where = orExpr();
  }

  // --- GROUP BY ------------------------------------------------------------
  const groupBy: string[] = [];
  if (isWord("GROUP")) {
    take();
    expectWord("BY");
    groupBy.push(columnName("after GROUP BY"));
    while (isOp(",")) {
      take();
      groupBy.push(columnName("after GROUP BY"));
    }
  }

  // --- ORDER BY ------------------------------------------------------------
  const orderBy: Query["orderBy"] = [];
  if (isWord("ORDER")) {
    take();
    expectWord("BY");
    const orderItem = () => {
      if (done()) throw new QueryError("ORDER BY needs something to sort on.");
      const token = take();
      const key =
        token.type === "number" ? Number(token.text) : token.text;
      let desc = false;
      if (isWord("DESC")) {
        take();
        desc = true;
      } else if (isWord("ASC")) {
        take();
      }
      orderBy.push({ key, desc });
    };
    orderItem();
    while (isOp(",")) {
      take();
      orderItem();
    }
  }

  // --- LIMIT ---------------------------------------------------------------
  let limit: number | null = null;
  if (isWord("LIMIT")) {
    take();
    if (done() || peek().type !== "number") {
      throw new QueryError("LIMIT takes a number.");
    }
    limit = Number(take().text);
  }

  if (isOp(";")) take();
  if (!done()) {
    throw new QueryError(
      `I did not expect "${peek().text}" at the end.`,
      "The order is SELECT, FROM, WHERE, GROUP BY, ORDER BY, LIMIT.",
    );
  }

  return { select: star ? [] : select, star, where, groupBy, orderBy, limit };
};

/** The endpoint's own naming, so a checked query reads like the file. */
export const defaultAlias = (column: string, fn: AggregateFn) =>
  column === "*" ? "row_count" : `${column}_${fn}`;
