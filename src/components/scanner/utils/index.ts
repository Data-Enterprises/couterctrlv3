/** The camera request: the rear camera at 1280 by 720. */
export const CONSTRAINTS = {
  video: { facingMode: "environment", width: 1280, height: 720 },
};

/**
 * The band Quagga decodes, as percentages inset from each edge.
 *
 * Reading only the middle keeps a neighbouring barcode on a shelf tag out of
 * the decode. These same numbers draw the on-screen guide below, so the box
 * cannot come to promise a region the decoder is not actually reading — the
 * two were written separately once and the guide ended up about eight percent
 * narrower than the truth.
 */
export const AREA = { top: 30, bottom: 30, left: 10, right: 10 };

/**
 * Viewfinder height.
 *
 * It buys more than screen presence: the decode band is the middle 40% of the
 * frame, so this is the one number that sets how tall a barcode can be and
 * still be read. At 175 that band was 70px, which is a tight target held at
 * arm's length over a shelf.
 */
export const FRAME_HEIGHT = 220;

/**
 * Why the camera would not start, in the user's terms.
 *
 * The three cases have different fixes — grant a permission, use another
 * device, serve over https — and "could not start the camera" sends someone
 * looking in the wrong place for all three.
 */
export const cameraMessage = (err: unknown) => {
  const name = (err as { name?: string } | null)?.name ?? "";
  if (name === "NotAllowedError" || name === "SecurityError")
    return "Camera access is blocked. Allow it for this site, or type the UPC.";
  if (name === "NotFoundError" || name === "DevicesNotFoundError")
    return "No camera found on this device. Type the UPC instead.";
  return "Could not start the camera. Type the UPC instead.";
};
