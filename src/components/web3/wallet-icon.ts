/** Only image data URIs, as EIP-6963 and Wallet Standard specify for wallet icons. */
export function safeWalletIcon(icon: string | undefined): string | null {
  return icon && /^data:image\/(svg\+xml|png|webp|jpeg|gif)[;,]/i.test(icon) ? icon : null;
}
