// Your workbench settings. Nothing here is secret: API keys and database credentials go in .env / Vercel, never here.
// Shared by the page and the server, so edit this one file to make the workbench yours.
export const config={
 appName:'科研工作台',          // shown in the sidebar, page title and AI connection
 assistantName:'助手',          // the chat assistant's display name
 timezone:'Asia/Shanghai',      // used for "today", daily limits and deadlines
 // PhD goal card on the Today page. Leave start or end empty to hide the card entirely.
 phd:{
  start:'',                     // enrolment date, e.g. '2025-09-01'
  end:'',                       // expected graduation date, e.g. '2030-06-30'
  goal:10,                      // target number of published papers
  endNote:''                    // optional line under the graduation date, e.g. '答辩日'
 }
};
