import { currentUser } from "@/lib/auth/currentUser";
import { listMessages } from "@/lib/chat/store";
import { listAgents } from "@/lib/agents/store";
import ChatBoard from "@/components/ChatBoard";

export default async function ChatPage() {
  const user = await currentUser();
  const [messages, agents] = user ? await Promise.all([listMessages(user.userId), listAgents(user.userId)]) : [[], []];

  return <ChatBoard initialMessages={messages} agents={agents} />;
}
