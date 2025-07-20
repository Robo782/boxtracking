async function n(o,t={}){const a=localStorage.getItem("token"),r={...t.headers||{},Authorization:`Bearer ${a}`},e=await fetch(o,{...t,headers:r});if(e.status===401||e.status===403)throw localStorage.clear(),window.location.href="/login",new Error("Session expired");return e}export{n as a};
//# sourceMappingURL=api-B34wtib_.js.map
