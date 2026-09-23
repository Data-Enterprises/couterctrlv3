import type { ExportExpr } from "../../../../api/salesExport";

/**
 * An expression, written back out as something close to what was typed.
 *
 * Not a faithful printer — it is for a line in the configuration panel, where
 * the question is "which of these is the loss/gain one". Brackets go in
 * wherever a child is a binary operation, which is more brackets than SQL
 * needs and no wrong ones.
 */
export const sketchExpr = (expr: ExportExpr): string => {
  switch (expr.kind) {
    case "column":
      return expr.name;
    case "literal":
      return expr.value === null ? "null" : String(expr.value);
    case "agg":
      return expr.fn === "count_distinct"
        ? `count(distinct ${expr.column})`
        : `${expr.fn}(${expr.column})`;
    case "neg":
      return `-${sketchExpr(expr.expr)}`;
    case "call":
      return `${expr.name}(${expr.args.map(sketchExpr).join(", ")})`;
    case "binary": {
      const side = (child: ExportExpr) =>
        child.kind === "binary" ? `(${sketchExpr(child)})` : sketchExpr(child);
      return `${side(expr.left)} ${expr.op} ${side(expr.right)}`;
    }
  }
};
