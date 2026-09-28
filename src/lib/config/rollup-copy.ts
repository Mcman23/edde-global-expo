export interface RollupCopy {
  headline: string;
  subheadline: string;
  callToAction: string;
  qrInstruction: string;
  brandWordmark: string;
  fullFormattedText: string;
}

export const ROLLUP_COPY: RollupCopy = {
  headline: 'YOUR FUTURE HAS NO BORDERS.',
  subheadline: 'WHERE COULD YOUR FUTURE TAKE YOU?',
  callToAction: 'SCAN TO ENTER THE EXPERIENCE',
  qrInstruction: '[QR CODE]',
  brandWordmark: 'EDDE GLOBAL',
  fullFormattedText: `YOUR FUTURE HAS NO BORDERS.
WHERE COULD YOUR FUTURE TAKE YOU?

SCAN TO ENTER THE EXPERIENCE
[QR CODE]

EDDE GLOBAL`,
};

export default ROLLUP_COPY;
