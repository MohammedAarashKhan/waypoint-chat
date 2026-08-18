(function(){
  const originalFetch=window.fetch.bind(window);
  const KEY=p=>'waypoint-'+p+'-api-key';
  const MODELS={anthropic:'claude-sonnet-4-20250514',openai:'gpt-4o',gemini:'gemini-3.6-flash'};
  function apiError(provider,status,data){
    const msg=data?.error?.message||data?.message||data?.error||('HTTP '+status);
    return String(msg);
  }
  window.fetch=async function(input,init){
    const url=typeof input==='string'?input:(input&&input.url)||'';
    if(!/^https:\/\/(api\.anthropic\.com|api\.openai\.com|generativelanguage\.googleapis\.com)\//.test(url)) return originalFetch(input,init);
    try{
      const response=await originalFetch(input,init);
      const text=await response.text();
      let data;
      try{data=JSON.parse(text)}catch{data={message:text.slice(0,500)}}
      if(!response.ok){
        const provider=url.includes('anthropic')?'Claude':url.includes('openai')?'OpenAI':'Gemini';
        return new Response(JSON.stringify({error:{message:provider+' API error ('+response.status+'): '+apiError(provider,response.status,data)}}),{status:response.status,headers:{'Content-Type':'application/json'}});
      }
      return new Response(text,{status:response.status,statusText:response.statusText,headers:{'Content-Type':'application/json'}});
    }catch(e){
      return new Response(JSON.stringify({error:{message:'Network/CORS error: '+(e?.message||String(e))}}),{status:502,headers:{'Content-Type':'application/json'}});
    }
  };
  window.waypointApiModels=MODELS;
})();
