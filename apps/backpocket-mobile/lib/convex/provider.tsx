/**
 * Convex Provider for React Native with Clerk auth
 */

import { useAuth } from "@clerk/clerk-expo";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ConvexReactClient } from "convex/react";
import type { ReactNode } from "react";
import { CONVEX_URL } from "@/lib/constants";

const convex = new ConvexReactClient(CONVEX_URL);

export function ConvexProvider({ children }: { children: ReactNode }) {
	return (
		<ConvexProviderWithClerk client={convex} useAuth={useAuth}>
			{children}
		</ConvexProviderWithClerk>
	);
}
