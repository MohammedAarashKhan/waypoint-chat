(function(){
  const KEY='waypoint-anthropic-api-key';
  const MODEL='claude-sonnet-4-20250514';
  const originalFetch=window.fetch.bind(window);

  function getKey(){
    let k=localStorage.getItem(KEY)||'';
    if(!k){
      k=window.prompt('Enter your Anthropic API key (sk-ant-...)');
      if(k) localStorage.setItem(KEY,k.trim());
    }
    return k.trim();
  }

  function addKeyButton(){
    const left=document.querySelector('.left');
    if(!left || document.getElementById('keyBtn')) return;
    const b=document.createElement('button');
    b.id='keyBtn'; b.className='icon'; b.title='Claude API key'; b.textContent='🔑';
    b.onclick=function(){
      const current=localStorage.getItem(KEY)||'';
      const action=window.prompt('Anthropic API key. Enter a new key to replace it, or leave blank to remove it.', current ? 'Key saved — enter a new key to replace it.' : '');
      if(action===null) return;
      if(action.trim()) localStorage.setItem(KEY,action.trim());
      else localStorage.removeItem(KEY);
      alert(localStorage.getItem(KEY)?'API key saved on this device.':'API key removed.');
    };
    left.appendChild(b);
  }

  window.fetch=async function(input,init){
    const url=typeof input==='string'?input:(input&&input.url)||'';
    if(!url.includes('/api/chat')) return originalFetch(input,init);
    try{
      const body=typeof init?.body==='string'?JSON.parse(init.body):{};
      const messages=Array.isArray(body.messages)?body.messages:[];
      const apiKey=getKey();
      if(!apiKey) return new Response(JSON.stringify({error:'Anthropic API key is required.'}),{status:400,headers:{'Content-Type':'application/json'}});
      const r=await originalFetch('https://api.anthropic.com/v1/messages',{
        method:'POST',
        headers:{
          'Content-Type':'application/json',
          'Accept':'application/json',
          'x-api-key':apiKey,
          'anthropic-version':'2023-06-01',
          'anthropic-dangerous-direct-browser-access':'true'
        },
        body:JSON.stringify({model:MODEL,max_tokens:1200,messages:messages.map(m=>({role:m.role==='assistant'?'assistant':'user',content:String(m.content||'')}))})
      });
      const text=await r.text();
      return new Response(text,{status:r.status,statusText:r.statusText,headers:{'Content-Type':'application/json'}});
    }catch(e){
      return new Response(JSON.stringify({error:e.message||'Unable to reach Anthropic.'}),{status:502,headers:{'Content-Type':'application/json'}});
    }
  };

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',addKeyButton); else addKeyButton();
})();
