(function(){
  const originalFetch=window.fetch.bind(window);
  function apiError(status,data){return String(data?.error?.message||data?.message||data?.error||('HTTP '+status));}
  window.fetch=async function(input,init){
    let url=typeof input==='string'?input:(input&&input.url)||'';
    if(url.includes('generativelanguage.googleapis.com')&&url.includes('/models/gemini-1.5-flash:')) url=url.replace('/models/gemini-1.5-flash:', '/models/gemini-3.6-flash:');
    if(!/^https:\/\/(api\.anthropic\.com|api\.openai\.com|generativelanguage\.googleapis\.com)\//.test(url)) return originalFetch(input,init);
    try{
      let req=input;
      if(url!==(typeof input==='string'?input:(input&&input.url)||'')) req=new Request(url,input instanceof Request?input:init);
      const response=await originalFetch(req,init);
      const text=await response.text();
      let data;try{data=JSON.parse(text)}catch{data={message:text.slice(0,500)}}
      if(!response.ok){
        const provider=url.includes('anthropic')?'Claude':url.includes('openai')?'OpenAI':'Gemini';
        return new Response(JSON.stringify({error:{message:provider+' API error ('+response.status+'): '+apiError(response.status,data)}}),{status:response.status,headers:{'Content-Type':'application/json'}});
      }
      return new Response(text,{status:response.status,statusText:response.statusText,headers:{'Content-Type':'application/json'}});
    }catch(e){
      return new Response(JSON.stringify({error:{message:'Network/CORS error: '+(e?.message||String(e))}}),{status:502,headers:{'Content-Type':'application/json'}});
    }
  };
})();
