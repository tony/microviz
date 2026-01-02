import type { FC } from "react";

type IconProps = { className?: string };

/**
 * Left panel expand icon (sidebar closed, arrow pointing right).
 * Used for the floating button when sidebar is collapsed.
 */
export const PanelLeftExpandIcon: FC<IconProps> = ({ className }) => (
  <svg
    aria-hidden="true"
    className={className}
    fill="currentColor"
    height="20"
    viewBox="0 0 20 20"
    width="20"
  >
    <path d="m13.18 10.5-1 .87a.5.5 0 0 0 .66.76l2-1.75a.5.5 0 0 0 0-.76l-2-1.75a.5.5 0 1 0-.66.76l1 .87H9.5a.5.5 0 0 0 0 1h3.68ZM2 14c0 1.1.9 2 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v8Zm2 1a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h3v10H4Zm4 0V5h8a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H8Z" />
  </svg>
);

/**
 * Left panel contract icon (sidebar open, arrow pointing left).
 * Used for the close button in the sidebar header.
 */
export const PanelLeftContractIcon: FC<IconProps> = ({ className }) => (
  <svg
    aria-hidden="true"
    className={className}
    fill="currentColor"
    height="20"
    viewBox="0 0 20 20"
    width="20"
  >
    <path d="M10.82 10.5h3.68a.5.5 0 0 0 0-1h-3.68l1-.87a.5.5 0 1 0-.66-.76l-2 1.75a.5.5 0 0 0 0 .76l2 1.75a.5.5 0 1 0 .66-.76l-1-.87ZM4 4a2 2 0 0 0-2 2v8c0 1.1.9 2 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2H4ZM3 6a1 1 0 0 1 1-1h3v10H4a1 1 0 0 1-1-1V6Zm5 9V5h8a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H8Z" />
  </svg>
);

/**
 * Right panel expand icon (inspector closed, arrow pointing left).
 * Used for the floating button when inspector is collapsed.
 */
export const PanelRightExpandIcon: FC<IconProps> = ({ className }) => (
  <svg
    aria-hidden="true"
    className={className}
    fill="currentColor"
    height="20"
    viewBox="0 0 20 20"
    width="20"
  >
    <path d="m6.82 10.5 1 .87a.5.5 0 0 1-.66.76l-2-1.75a.5.5 0 0 1 0-.76l2-1.75a.5.5 0 0 1 .66.76l-1 .87h3.68a.5.5 0 0 1 0 1H6.82ZM18 14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6c0-1.1.9-2 2-2h12a2 2 0 0 1 2 2v8Zm-2 1a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1h-3v10h3Zm-4 0V5H4a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h8Z" />
  </svg>
);

/**
 * Right panel contract icon (inspector open, arrow pointing right).
 * Used for the close button in the inspector header.
 */
export const PanelRightContractIcon: FC<IconProps> = ({ className }) => (
  <svg
    aria-hidden="true"
    className={className}
    fill="currentColor"
    height="20"
    viewBox="0 0 20 20"
    width="20"
  >
    <path d="m9.18 10.5-1 .87a.5.5 0 1 0 .66.76l2-1.75a.5.5 0 0 0 0-.76l-2-1.75a.5.5 0 1 0-.66.76l1 .87H5.5a.5.5 0 0 0 0 1h3.68ZM16 16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v8c0 1.1.9 2 2 2h12Zm1-2a1 1 0 0 1-1 1h-3V5h3a1 1 0 0 1 1 1v8Zm-5-9v10H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h8Z" />
  </svg>
);
