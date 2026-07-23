import { headers } from "next/headers";
import { cookieToInitialState } from "wagmi";
import { config } from "@/lib/web3/config";
import { Providers } from "./providers";

export default async function PilotLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Next 16: headers() é assíncrono — precisa de await.
  const initialState = cookieToInitialState(config, (await headers()).get("cookie"));

  return <Providers initialState={initialState}>{children}</Providers>;
}
