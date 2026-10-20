import { getRequestConfig } from "next-intl/server";
import messages from "../messages/fa.json";

export default getRequestConfig(async () => ({
  locale: "fa",
  timeZone: "Asia/Tehran",
  messages,
}));
