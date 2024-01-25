import NextAuth from "next-auth";
import GithubProvider from "next-auth/providers/github";

import { serverConfig } from "@/config";

export default NextAuth({
  providers: [
    GithubProvider({
      clientId: String(serverConfig.GITHUB_CLIENT_ID),
      clientSecret: String(serverConfig.GITHUB_CLIENT_SECRET),
    }),
  ],
});
