// Hooks
import { useEffect, useRef, useState } from "react";

// Redux
import {
  setFlag,
  setProductCodes,
  setProductDescriptions,
} from "../../../../../features/dev/devExportBuilderSlice";

// Utils
import {
  parseProductCodes,
  parseDescriptionTerms,
} from "../../utils/productCodes";

// Interfaces
import type { ExportCtx } from "../interfaces";

/**
 * The configuration panel's text boxes: the column, list and group searches,
 * the product codes and description words, and the file name. The codes, words
 * and name reach the store a beat after typing stops, and each box follows the
 * store when something else writes to it.
 */
export const useConfigText = ({
  columns,
  filePrefix,
  productCodes,
  productDescriptions,
  dispatch,
}: {
  columns: ExportCtx["columns"];
  filePrefix: string;
  productCodes: string[];
  productDescriptions: string[];
  dispatch: ExportCtx["dispatch"];
}) => {
  /**
   * Typing lives here, not in the store.
   *
   * A keystroke dispatched to Redux changes the slice object, and everything
   * reading it re-renders — including the CSV table, which is fifty rows of up
   * to ninety-nine columns. Five thousand cells diffed per character is what
   * made these boxes feel heavy. None of this text is needed outside the
   * panel, so none of it goes through the store.
   */
  const [columnQuery, setColumnQuery] = useState("");
  /** What is typed in each long list's search box, by filter name. */
  const [listQuery, setListQuery] = useState<Record<string, string>>({});
  const [groupQuery, setGroupQuery] = useState("");
  const [codeText, setCodeText] = useState("");
  const [descriptionText, setDescriptionText] = useState("");
  const [fileName, setFileName] = useState(filePrefix);

  // A new config is a new scope; last question's typing does not belong to it.
  useEffect(() => {
    setColumnQuery("");
    setListQuery({});
    setGroupQuery("");
    setCodeText("");
    setDescriptionText("");
    // The output flags survive a reload, so this one is a resync, not a clear.
    //
    // Deliberately not keyed on the flag as well: the store gets the name a
    // beat after typing stops, and reacting to that would write the settled
    // value back over whatever had been typed in the meantime.
    setFileName(filePrefix);
  }, [columns]);

  /**
   * The codes do have to reach the store — they filter the sample and go to
   * the endpoint — but not on every keystroke. Parsed a beat after typing
   * stops, so a pasted column of four hundred codes costs one pass, not four
   * hundred.
   */
  const parseTimer = useRef<number | undefined>(undefined);
  const termTimer = useRef<number | undefined>(undefined);
  const nameTimer = useRef<number | undefined>(undefined);
  useEffect(
    () => () => {
      window.clearTimeout(parseTimer.current);
      window.clearTimeout(termTimer.current);
      window.clearTimeout(nameTimer.current);
    },
    [],
  );

  const onDescriptionText = (value: string) => {
    setDescriptionText(value);
    window.clearTimeout(termTimer.current);
    termTimer.current = window.setTimeout(() => {
      termTimer.current = undefined;
      dispatch(setProductDescriptions(parseDescriptionTerms(value)));
    }, 250);
  };

  // The file name is read once, when the export runs, so it can settle first
  // for the same reason the codes do.
  const onFileName = (value: string) => {
    setFileName(value);
    window.clearTimeout(nameTimer.current);
    nameTimer.current = window.setTimeout(() => {
      nameTimer.current = undefined;
      dispatch(setFlag({ filePrefix: value }));
    }, 250);
  };
  const onCodeText = (value: string) => {
    setCodeText(value);
    window.clearTimeout(parseTimer.current);
    parseTimer.current = window.setTimeout(() => {
      parseTimer.current = undefined;
      dispatch(setProductCodes(parseProductCodes(value)));
    }, 250);
  };

  /**
   * The three boxes follow the store when something else writes to it.
   *
   * Loading a saved configuration, reloading a build or applying the query
   * all set the codes, the description terms and the file name in the store,
   * and the boxes kept showing what had been typed before -- so the filter in
   * force and the text on screen disagreed. Each box is rewritten from the
   * store only when the two no longer mean the same thing, so someone's own
   * spacing survives, and never while their typing is still waiting to
   * settle: the store is a beat behind the box then, by design.
   */
  const codesKey = productCodes.join("\n");
  useEffect(() => {
    if (parseTimer.current !== undefined) return;
    if (parseProductCodes(codeText).join("\n") === codesKey) return;
    setCodeText(codesKey);
  }, [codesKey]);

  const termsKey = productDescriptions.join("\n");
  useEffect(() => {
    if (termTimer.current !== undefined) return;
    if (parseDescriptionTerms(descriptionText).join("\n") === termsKey) return;
    setDescriptionText(termsKey);
  }, [termsKey]);

  useEffect(() => {
    if (nameTimer.current !== undefined) return;
    if (fileName !== filePrefix) setFileName(filePrefix);
  }, [filePrefix]);

  /** Empties the codes box and the filter at once, dropping any pending parse. */
  const clearCodes = () => {
    setCodeText("");
    window.clearTimeout(parseTimer.current);
    dispatch(setProductCodes([]));
  };
  /** The same for the description words. */
  const clearTerms = () => {
    setDescriptionText("");
    window.clearTimeout(termTimer.current);
    dispatch(setProductDescriptions([]));
  };

  return {
    columnQuery,
    setColumnQuery,
    listQuery,
    setListQuery,
    groupQuery,
    setGroupQuery,
    codeText,
    onCodeText,
    clearCodes,
    descriptionText,
    onDescriptionText,
    clearTerms,
    fileName,
    onFileName,
  };
};
