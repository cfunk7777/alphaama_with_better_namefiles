/*

alphaama
A<3   aa   
      v3

*/


const aa = 
{
  actions:[],
  db: 
  {
    e:{}, // memory events (dat)
    p:{}, // memory profiles (pro)
    q:{},
  },
  clk:{},
  dependencies:
  [
    '/dep/nostr_tools_2.js?v=20000',
    '/dep/asciidoctor.min.js?v=3.0.4',
    // '/dep/blurhash.js?v=10000',
  ],
  extensions:
  {
    img:['jpg','jpeg','gif','webp','png','heic'],
    av:['mp3','mp4','webm'],
  },
  fx:{},
  get:{},
  is:{},
  l:document.documentElement,
  kinds:{},
  miss:{e:{},p:{}},
  mk:{},
  mods:
  [
    '/cli/cli.js',
    '/o/o.js',
    '/e/e.js',
    '/p/p.js',
    '/q/q.js',
    '/r/r.js',
    '/u/u.js',
    '/i/i.js',
  ],
  parse:{},
  state:{},
  styles:
  [
    '/aa/aa.css',
    '/aa/l.css'
  ],
  t:{ get now(){ return Math.floor(Date.now()/1000) }},
  temp:{},
  tools:
  [
    '/aa/is.js',
    '/aa/t.js',
    '/aa/fx.js',
    '/aa/mk.js',
    '/aa/clk.js',
    '/aa/parse.js',
    '/aa/db.js',
    '/aa/state.js',
  ],
  viewing:false,
  views:[],
};


// parses string as action and executes it
aa.exe =s=>
{
  let a = s.split(' ');
  a.shift();
  if (a.length) 
  {
    let actions = aa.actions.filter(o=>o.action[0] === a[0]);
    if (a[1]) 
    {
      actions = actions.filter(o=>o.action[1] === a[1]);
      a.splice(0,2);
    }
    else 
    {
      actions = actions.filter(o=>!o.action[1]);
      a.splice(0,1);
    }
    let act = actions[0];
    let cut = a.join(' ');
    if (act && 'exe' in act) act.exe(cut);
  }
  else aa.log('invalid action: '+s)
};


// open a dialog
aa.dialog =async o=>
{
  const dialog = aa.mk.dialog();
  if (!dialog || dialog.open) return false;
  if (o.title) dialog.title = o.title;
  if (o.hasOwnProperty('l')) dialog.append(o.l);
  
  const dialog_options = aa.mk.l('p',{id:'dialog_options'});
  
  const dialog_no = aa.mk.l('button',
  {
    con:o.no.title ?? 'cancel',
    cla:'butt cancel',
    clk:e=>{ o.no.exe(); dialog.close()}
  });
  dialog_no.setAttribute('autofocus',true);
  
  const dialog_yes = aa.mk.l('button',
  {
    con:o.yes.title ?? 'confirm',
    cla:'butt confirm',
    clk:e=>{ o.yes.exe(); dialog.close()}
  });

  dialog_options.append(dialog_no,dialog_yes);
  dialog.append(dialog_options);
  dialog.showModal();
  if (o.scroll) dialog.scrollTop = dialog.scrollHeight;
};


// make element with options
aa.mk.l =(tag_name,o=false)=>
{
  const l = document.createElement(tag_name);
  if (!o || typeof o !== 'object') return l;
  for (const k in o)
  {
    const v = o[k];
    switch (k)
    {
      case 'con': l.textContent = v; break;
      case 'id':  l.id = v; break;
      case 'cla': l.className = v; break;
      case 'bef': l.dataset.before = v; break;
      case 'aft': l.dataset.after = v; break;
      case 'ref': l.href = v; break;
      case 'rel': l.rel = v; break;
      case 'src': l.src = v; break;
      case 'tit': l.setAttribute('title',v); break;
      case 'app': l.append(v); break;
      case 'clk': l.addEventListener('click',v); break;
      case 'nam': l.name = v; break;
      case 'val': l.value = v; break;
      case 'pla': l.placeholder = v; break;
      case 'tab': l.tabIndex = v; break;
      case 'siz': l.sizes = v; break;
      case 'typ': l.type = v; break;
    }
  }
  return l
};


// head meta elements
aa.head_meat =async()=>
{
  document.head.append(aa.mk.l('link',{rel:'manifest',ref:'/site.webmanifest'}));
  fetch('/site.webmanifest')
  .then(dis=>dis.json()).then(manifest=>
  {
    console.log(manifest);
    
    for (const icon of manifest.icons)
    {
      let link = aa.mk.l('link');
      if (icon.src.includes('apple-touch-icon'))
      {
        link.rel = 'apple-touch-icon';
        link.sizes = icon.sizes;
      }
      else if (icon.src.includes('safari-pinned-tab'))
      {
        link.rel = 'mask-icon';
        link.color = manifest.theme_color
      }
      else
      {
        link.rel = 'icon';
        if ('sizes' in icon) link.sizes = icon.sizes;
        if ('type' in icon) link.type = icon.type;
      }
      link.href = icon.src;
      document.head.append(link);
    }
  });
};


// head styles
aa.head_styles =async styles=>
{
  for (const s of styles)
  document.head.append(aa.mk.l('link',{rel:'stylesheet',ref:s}));
};


// head scripts
aa.head_scripts =async scripts=>
{
  for (const s of scripts) 
  document.head.append(aa.mk.l('script',{src:s}));
};


// if no options found, load with defaults
aa.load =(o={})=>
{
  aa.head_meat();
  aa.styles_loaded = o.styles ? o.styles : aa.styles;
  aa.dependencies_loaded = o.dependencies ? o.dependencies : aa.dependencies;
  aa.tools_loaded = o.tools ? o.tools : aa.tools;
  aa.mods_loaded = o.mods ? o.mods : aa.mods;
  aa.head_styles(aa.styles_loaded);
  aa.head_scripts(aa.dependencies_loaded);
  aa.head_scripts(aa.tools_loaded);
  aa.head_scripts(aa.mods_loaded);
};


// log stuff
aa.log =async(s,l=false)=>
{
  const log = aa.mk.l('li',{cla:'l item is_new'});
  if (typeof s === 'string') s = aa.mk.l('p',{con:s});
  log.append(s);
  if (!l) l = aa.logs || document.getElementById('logs');
  if (l) l.append(log);
  else console.log('log:',s)
};
// logs container element
aa.logs = aa.mk.l('ul',{id:'logs',cla:'list'});

aa.logs_read =async()=>
{
  const log_new = document.querySelectorAll('.l.is_new');
  if (log_new.length) for (const l of log_new) 
  {
    l.classList.remove('is_new');
    l.classList.add('just_added');
  }
};


// logs mutation observer
// aa.logs_mo = new MutationObserver(a=> 
// {
//   for (const mutation of a) 
//   {
//     const section = mutation.target.closest('section');
//     if (section)
//     {
//       let butt = section.querySelector('section > header > .butt');
//       aa.fx.data_count(butt,'.l');
//     }
//   }
// });


// tries to delete everything saved locally 
// and then reload clean
aa.reset =()=>
{
  aa.log('shh... go to sleep now.');
  aa.db.cash.ops({clear:'ALL'});
  aa.db.idb.ops({clear:{stores:['stuff','authors','events']}})
  .then(()=>
  {
    localStorage.clear();
    sessionStorage.clear();
    setTimeout(()=>{location.reload()},1000)
  });
};
// reset action
aa.actions.push(
{
  action:['zzz'],
  description:'resets everything',
  exe:aa.reset
});


// if no options found, run with defaults
aa.run =(o={})=>
{
  // aa.logs_mo.observe(aa.logs,{attributes:false,childList:true});
  const main = aa.mk.l('main',{id:'view'});
  document.body.prepend(main);
  
  if (aa.is.rigged()) aa.l.classList.add('rigged');
  aa.wl.lock();
  aa.fx.scrolled();

  aa.log((aa.is.online() ? 'on' : 'off') + 'line at '+location.origin);
  // aa.log('device is '+ aa.is.online() ? 'on' : 'off' + 'line')
  aa.u.check_signer();
  aa.asciidoc = Asciidoctor$$module$build$asciidoctor_browser();
};


// load mod
aa.mod_load =async mod=>
{
  // console.log(mod);
  let mod_o = mod.o;

  if (!mod_o) 
  {
    mod_o = await aa.db.idb.ops({get:{store:'stuff',key:mod.def.id}});
    if (mod_o) mod.o = mod_o;
    else if (!mod_o && mod.old_id)
    {
      // in case the db key path changes, import to new key id
      // if old_id is found
      mod_o = await aa.db.idb.ops({get:{store:'stuff',key:mod.old_id}});
      if (mod_o)
      {
        mod_o.id = mod.def.id;
        mod.o = mod_o;
        aa.mod_save(mod);
      }
    }
    if (!mod_o && mod.def) mod.o = mod.def;
  }
  if (!mod.o.ls) mod.o.ls = {};
  return mod
};


// save mod
aa.mod_save = async mod=>
{
  return new Promise(resolve=>
  {
    console.log(mod);
    if (mod && mod.o && mod.o.id)
    {
      aa.db.idb.worker.postMessage({put:{store:'stuff',a:[mod.o]}});
    }
    resolve(mod)
  })  
};


// update mod item element
aa.mod_ui =(mod,k,v)=>
{
  let cur = document.getElementById(mod.def.id+'_'+aa.fx.an(k));
  let l = mod.hasOwnProperty('mk') ? mod.mk(k,v) : aa.mk.item(k,v);
  if (!cur) document.getElementById(mod.def.id).append(l);
  else cur.replaceWith(l);
};


// log a notice
aa.notice =async o=>
{
  // o =
  // {
  //   title:'',
  //   description:'',
  //   no:{title:'',exe:()=>{}},
  //   yes:{title:'',exe:()=>{}},
  // }

  let l = aa.mk.l('div',{cla:'notice'});
  if (o.hasOwnProperty('title')) 
  {
    l.append(aa.mk.l('p',{cla:'title',con:o.title}));
  }
  if (o.hasOwnProperty('description')) 
  {
    l.append(aa.mk.l('p',{cla:'description',con:o.description}));
  }
  if (o.hasOwnProperty('no'))
  {
    l.append(aa.mk.l('button',{con:o.no.title,cla:'butt no',clk:o.no.exe}));
  } 
  if (o.hasOwnProperty('yes'))
  {
    l.append(aa.mk.l('button',{con:o.yes.title,cla:'butt yes',clk:o.yes.exe}));
  }
  aa.log(l);
};


// reusable regex
aa.regx = 
{
  get an() {return /^[A-Z_0-9]+$/i},
  get hashtag(){ return /(\B[#])\w+/g},
  get lnbc(){ return /((lnbc)[A-Z0-9]*)\b/gi},
  get magnet(){ return /(magnet:\?xt=urn:btih:.*)/gi},
  get nostr() { return /((nostr:)[A-Z0-9]{12,})\b/gi},
  get url(){ return /https?:\/\/([a-zA-Z0-9\.\-]+\.[a-zA-Z]+)([\p{L}\p{N}\p{M}&\.-\/\?=#\-@%\+_,:!~\/\*]*)/gu}, 
};


// timeout with delay if called again before for some time
aa.to =async(f,t,s)=>
{
  if (!aa.todo) aa.todo = {};
  if (aa.todo.hasOwnProperty(s)) clearTimeout(aa.todo[s]);
  aa.todo[s] = setTimeout(f,t);
};


// wakelock
aa.wl = {wakelock:null,get haz_wakelock(){return 'wakeLock' in navigator}};
// prevent screen from going to sleep if tab is active
aa.wl.lock =async()=>
{
  if (!aa.wl.haz_wakelock) return;
  try 
  {
    aa.wl.wakelock = await navigator.wakeLock.request();
    const m =()=>{console.log('wake state locked:',!aa.wl.wakelock.released)};
    aa.wl.wakelock.addEventListener('release',m);
    m();
  } 
  catch(er){ console.error('failed to lock wake state:', er.message) }
};
// release screen from locked state
aa.wl.release =()=>
{
  if (aa.wl.wakelock) aa.wl.wakelock.release();
  aa.wl.wakelock = null;
};


// get and log src
// aa.get.md =async src=>
// {
//   return new Promise(resolve=>
//   {
//     fetch(src).then(dis=>dis.text()).then(dis=>
//     {
//       let text = aa.parse.content(dis);
//       let l = aa.mk.l('article',{cla:'content parsed',app:text});
//       let title = dis.slice(0,dis.indexOf('\n'));
//       resolve(aa.mk.details(title,l));
//     })
//   })
// };