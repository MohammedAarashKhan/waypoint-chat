(function(){
  const originalFetch=window.fetch.bind(window);
  function apiError(status,data){return String(data?.error?.message||data?.message||data?.error||('HTTP '+status));}
  window.fetch=async function(input,init){
    const originalUrl=typeof input==='string'?input:(input&&input.url)||'';
    let url=originalUrl;
    if(url.includes('generativelanguage.googleapis.com')&&url.includes('/models/gemini-1.5-flash:')) url=url.replace('/models/gemini-1.5-flash:', '/models/gemini-3.6-flash:');
    if(!/^https:\/\/(api\.anthropic\.com|api\.openai\.com|generativelanguage\.googleapis\.com)\//.test(url)) return originalFetch(input,init);
    try{
      let response;
      if(url!==originalUrl){
        const req=input instanceof Request?new Request(url,input):new Request(url,init);
        response=await originalFetch(req);
      }else response=await originalFetch(input,init);
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
