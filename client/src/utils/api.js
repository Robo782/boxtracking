const base  = import.meta.env.VITE_API ?? "/api";
const token = () => localStorage.getItem("token") ?? "";

const hdr = (h = {}) => ({
  "Content-Type": "application/json",
  Authorization  : `Bearer ${token()}`,
  ...h,
});

const json = r => r.ok ? r.json() : Promise.reject(new Error(r.status));

export default {
  get : (u,o={}) => fetch(base+u,{...o,headers:hdr(o.headers)}).then(json),

  post: (u,b,o={}) => fetch(base+u,{
           method:"POST",
           body:o.file?b:JSON.stringify(b),
           headers:o.file?o.headers:hdr(o.headers),
         }).then(json),

  del : (u,o={}) => fetch(base+u,{
           method:"DELETE",
           headers:hdr(o.headers),
         }).then(json),
};
