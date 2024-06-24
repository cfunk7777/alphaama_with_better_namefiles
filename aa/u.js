// u stuff

aa.u = 
{
  def:{id:'u',ls:{}},
  old_id:'aka',
  sn:'u',
};


// check for nip7 extension (window.nostr) availability

aa.u.check_signer =()=>
{
  let s = 'window.nostr ok';
  if (!window.nostr)
  {
    aa.log(aa.mk.l('button',
    {
      con:'nip7 signer not found (!window.nostr)',
      cla:'butt',
      clk:e=>
      {
        aa.clk.clkd(e.target);
        if (window.nostr)
        {
          let parent = e.target.parentElement;
          parent.textContent = '';
          parent.append(aa.mk.l('p',{con:s}));
        } 
      }
    }));
  }
  else aa.log(s);
};


// decrypt kind-4 from id

aa.u.decrypt =async s=>
{
  aa.cli.fuck_off();
  if (window.nostr)
  {
    let x = s.trim();
    if (!aa.is.x(x))
    {
      aa.log('invalid id');
      return false;
    }
    
    let dat = await aa.db.get_e(x);
    if (!dat) 
    {
      aa.log('event not found');
      return false;
    }
    let u_x = aa.u.o.ls.xpub;
    let p_x = aa.get.tags(dat.event,'p')[0][1];
    if (u_x !== p_x)
    {
      aa.log('content not for you');
      return false;
    }
    let decrypted = await window.nostr.nip04.decrypt(dat.event.pubkey,dat.event.content);
    if (!decrypted)
    {
      aa.log('not possible to decrypt');
      return false;
    }
    let l = document.getElementById(aa.fx.encode('nid',x));
    if (!l) 
    {
      aa.log('decrypted cyphertext:');
      aa.log(decrypted);
    }
    else
    {
      let content = l.querySelector('.content');
      content.classList.add('decrypted');
      content.classList.remove('encrypted');
      content.querySelector('.butt.decrypt').remove();
      l.querySelector('.content').append(aa.parse.content(decrypted));
    }

    console.log(decrypted);
  }
  else aa.log('no extension found')  
};


// true if you follow pubkey

aa.u.is_following =xpub=>
{
  let p = aa.db.p[aa.u.o.ls.xpub];
  if (p && p.extradata.bff.length)
  {
    if (p.extradata.bff.includes(xpub)) return true;
    else return false;
  }
  // else aa.log('no bff found to check');
};


// load profiles of your follows

aa.u.is_following_load_profiles =async p=>
{
  // console.log('loaaa.dbff');
  
  if (p.extradata.bff.length)
  {
    let bffs = await aa.db.idb.ops({get_a:{store:'authors',a:p.extradata.bff}});
    for (const bff of bffs) aa.db.p[bff.xpub] = bff;
    for (const x of p.extradata.bff)
    {
      if (!aa.db.p[x]) aa.db.p[x] = aa.p.p(x);
      aa.p.profile(aa.db.p[x])
    } 
  }
};


// if hex key is your pubkey

aa.u.is_u =(x)=> aa.u?.o.ls.xpub === x;


// make p tag array from array

aa.mk.tag_p =a=>
{
  let p_tag = ['p'];
  let k,relay,petname;
  
  if (a.length) k = a.shift().trim();
  if (!k) return false;
  if (k.startsWith('npub')) k = aa.fx.decode(k);
  if (!aa.is.key(k)) {aa.log('invalid key to follow '+k);return false}
  if (aa.u.is_following(k)) {aa.log('already following '+k);return false}
  p_tag.push(k);

  if (a.length) 
  {
    relay = a.shift().trim();
    let url = aa.is.url(relay);
    if (url) p_tag.push(url.href);
    else p_tag.push('')
  }

  if (a.length) 
  {
    petname = a.shift().trim();
    p_tag.push(aa.fx.an(petname));
  }
  return p_tag
};


// u add to follows

aa.u.follow =async s=>
{
  // console.log(s);
  if (!aa.u.o.ls.xpub) 
  {
    aa.log('no u found, set one first')
    return false;
  }
  aa.cli.fuck_off();
  
  const a = s.trim().split(',');
  let p_tag = aa.mk.tag_p(a);
  if (!p_tag) return false;

  // let p_tag = ['p'],k,relay,petname;
  
  // if (a.length) k = a.shift().trim();
  // if (!k) return false;
  // if (k.startsWith('npub')) k = aa.fx.decode(k);
  // if (!aa.is.key(k)) {aa.log('invalid key to follow '+k);return false}
  // if (aa.u.is_following(k)) {aa.log('already following '+k);return false}
  // p_tag.push(k);

  // if (a.length) 
  // {
  //   relay = a.shift().trim();
  //   let url = aa.is.url(relay);
  //   if (url) p_tag.push(url.href);
  //   else p_tag.push('')
  // }

  // if (a.length) 
  // {
  //   petname = a.shift().trim();
  //   p_tag.push(aa.fx.an(petname));
  // }
  
  let dat_k3 = await aa.p.get_k3();
  if (dat_k3)
  {
    const new_k3 =
    {
      pubkey:aa.u.o.ls.xpub,
      kind:3,
      created_at:aa.t.now(),
      content:dat_k3.event.content,
      tags:[...dat_k3.event.tags,p_tag]
    };
    // const new_follows = [...dat_k3.event.tags,p_tag];
    aa.confirm(
    {
      title: 'new follow list',
      l:aa.mk.tag_list(new_k3.tags),
      scroll:true,
      no:{exe:()=>{}},
      yes:{exe:()=>{
        // const event = 
        // {
        //   pubkey:aa.u.o.ls.xpub,
        //   kind:3,
        //   created_at:aa.t.now(),
        //   content:dat_k3.event.content,
        //   tags:new_follows
        // };
        aa.e.finalize_event(new_k3).then(e=>{console.log('sent')});
      } },
    });
  }
  else aa.log('no k3 found, create one first')
};


// on load

aa.u.load =()=>
{ 
  aa.actions.push(
    {
      action:['u','login'],
      optional:['easy || hard'],
      description:'load pubkey and relays from ext with optional mode, leave blank for default',
      exe:aa.u.login
    },
    {
      action:['u','decrypt'],
      required:['id'],
      description:'decrypt note',
      exe:aa.u.decrypt
    },
    {
      action:['u','md'],
      description:'autofills metadata to edit and set',
      exe:aa.u.metadata_load
    },
    {
      action:['u','smd'],
      required:['{JSON}'], 
      description:'set metadata (kind-0)',
      exe:aa.u.metadata_set
    },
    {
      action:['e','react'],
      required:['id','reaction'], 
      description:'react to a note',
      exe:aa.u.react
    },
    {
      action:['p','follow'],
      required:['id'], 
      optional:['relay','petname'], 
      description:'follow account (hex or npub)',
      exe:aa.u.follow
    },
    {
      action:['p','unfollow'],
      required:['id'], 
      optional:['more ids..'], 
      description:'unfollow account (hex or npub)',
      exe:aa.u.unfollow
    },
    
  );
  const id = 'u_u';
  const u = aa.mk.l('aside',{id:id});
  document.body.insertBefore(u,document.body.lastChild);
  u.append(aa.mk.butt_expand(id))
  
  aa.mod_load(aa.u).then(aa.u.start);
};


// u login

aa.u.login =async s=>  
{
  // aa.cli.fuck_off();
  aa.cli.clear();
  aa.u.set_mode(s.trim());

  return new Promise(resolve=>
  {
    if (window.nostr && aa.u)
    {
      window.nostr.getPublicKey().then(x=>
      {
        aa.u.set_u_p(x);
        if (aa.r) 
        {
          aa.r.ext().then(()=>
          {
            resolve('login with relays')
          });
        }
        else resolve('login without relays')
      });
    }
    else 
    {
      aa.log('enable extension first and try again');
      resolve('no login');
    }
  });
};

// load your metadata into input prefixed with set metadata command

aa.u.metadata_load =()=>
{
  const md = aa.db.p[aa.u.o.ls.xpub].metadata;
  if (md) aa.cli.v(localStorage.ns+' '+aa.u.sn+' smd '+JSON.stringify(md));
};


// set your metadata (kind-0)

aa.u.metadata_set =async s=>
{
  // aa.cli.fuck_off();
  aa.cli.clear();
  let md = aa.parse.j(s);
  if (!md) return;
  aa.confirm(
  {
    title:'new metadata',
    l:aa.mk.ls({ls:md}),
    no:{exe:()=>{}},
    yes:{exe:()=>
    {
      const event = 
      {
        pubkey:aa.u.o.ls.xpub,
        kind:0,
        created_at:aa.t.now(),
        content:JSON.stringify(md),
        tags:[]
      };
      aa.e.finalize_event(event).then(e=>{console.log(e)});
    }},
  });
};


// process all p tags from kind-3
// should be in kin / aa.e

aa.u.process_k3_tags =async(tags,x)=>
{
  const is_u = aa.u.is_u(x);
  const to_upd = [];
  if (is_u) aa.u.follows = tags;
  for (const tag of tags)
  {
    if (!aa.is.tag.p(tag)) continue;
    
    let updd;
    const [type,xpub,relay,petname] = tag;
    if (aa.is.x(xpub))
    {
      let p = aa.db.p[xpub];
      if (!p) 
      {
        p = aa.db.p[xpub] = aa.p.p(xpub);
        updd = true;
      }  

      if (relay)
      {
        let url = aa.is.url(relay)?.href;
        if (url)
        {
          if (!p.rels) p.rels = {};
          if (!p.rels[url]) p.rels[url] = {sets:[]};
          if (aa.fx.a_add(p.rels[url].sets,['hint'])) updd = true;
        }
        if (is_u && p.relay !== relay) { p.relay = relay; updd = true; }
      }

      if (petname)
      {
        if (aa.fx.a_add(p.extradata.petnames,[petname])) updd = true;
        if (is_u && p.petname !== petname) { p.petname = petname; updd = true; }
      }

      if (aa.fx.a_add(p.extradata.followers,[x])) updd = true;
      if (is_u && p.trust === 0) { p.trust = 5; updd = true; }
      
      if (updd) to_upd.push(p);
      if (aa.viewing === p.npub) aa.p.update(aa.p.profile(p),p,true);
    }
    else console.log('invalid hex key in k3 of '+x,xpub)
  }

  if (to_upd.length) aa.db.idb.worker.postMessage({put:{store:'authors',a:to_upd}});
};

// new reaction event (kind-7)
// should go to aa.e

aa.u.react =async s=>
{
  let [xid,reaction] = s.trim().split(' ');
  if (aa.is.x(xid) && aa.is.one(reaction))
  {
    aa.cli.fuck_off();
    
    const event = 
    {
      pubkey:aa.u.o.ls.xpub,
      kind:7,
      created_at:aa.t.now(),
      content:reaction,
      tags:[]
    };

    let reply_dat = aa.db.e[xid];
    if (!reply_dat) reply_dat = await aa.db.get_e(xid);
    if (reply_dat)
    {
      const reply_e = aa.db.e[xid].event;
      event.tags.push(...aa.get.tags_for_reply(reply_e));
    } 
    aa.e.finalize_event(event).then(e=>{console.log(e)});
  }
  else aa.log('invalid data to score')
};


// u set mode

aa.u.set_mode =async s=>
{
  switch (s)
  {
    case 'easy':
      let butt_u = document.getElementById('butt_u');
      if (!butt_u.parentElement.classList.contains('.expanded')) butt_u.click();
      aa.o.set('mode easy');
      aa.q.stuff();
      break;

    case 'hard': 
      aa.o.set('mode hard'); 
      break;

    default:
      aa.o.set('mode normal');
  }
};


// u set pubkey

aa.u.set_u_p =s=>
{   
  let pub = s.trim();
  if (pub) 
  {
    let o = {};
    if (!aa.is.x(pub) && pub.startsWith('npub')) o = {xpub:aa.fx.decode(pub),npub:pub};
    else if (aa.is.x(pub)) o = {xpub:pub,npub:aa.fx.encode('npub',pub)};
    aa.u.o.ls = o;
    aa.mod_save(aa.u);
    aa.u.start(aa.u);
  } 
};


// 

aa.u.mk =(k,v)=>
{
  let l;
  switch (k)
  {
    case 'npub':
      l = aa.mk.l('li',{id:aa.u.def.id+'_'+k,cla:'item'});
      let link = aa.mk.nostr_link(v,'-->');
      link.classList.add('key');
      link.title = 'view u';
      l.append(
        link,' ',
        // aa.mk.l('span',{cla:'key',app:link}),
        aa.mk.l('span',{cla:'val',con:v})
      );
      break;
      
    default: l = aa.mk.item(k,v);
  }
  return l
};


// start mod

aa.u.start =async mod=>
{
  let ls = mod.o.ls;
  if (ls.xpub)
  {
    aa.mk.mod(mod);

    // aa.log('u_x '+ls.xpub);
    // const user_link = aa.mk.nostr_link(ls.npub,'-->');
    // const up = aa.mk.l('p');
    // up.append(user_link,' ',ls.npub);
    // aa.log(up);
    


    let butt_u = document.getElementById('butt_u_u');
    if (butt_u)
    {
      aa.fx.color(ls.xpub,butt_u);
      butt_u.textContent = ls.xpub.slice(0,3);
    }

    let p = await aa.db.get_p(ls.xpub);
    if (!p) p = aa.p.p(ls.xpub);
    if (p)
    {
      let changed;
      // console.log(p);
      if (p.trust < 9) 
      {
        p.trust = 9;
        changed = true;
      }
      if (aa.fx.a_add(p.sets,['u'])) changed = true;
      if (butt_u) aa.p.pic(butt_u,p.metadata.picture);
      if (!p.pastdata.k0.length) aa.log('u !metadata');
      if (!p.pastdata.k3.length) aa.log('u !bffs');
      else aa.u.is_following_load_profiles(p);
      aa.p.profile(p);
      if (changed) aa.p.save(p);
    } 
  }
  else 
  {
    let login_butt = aa.mk.butt_action('u login ');
    login_butt.id = 'login_butt';
    aa.log(login_butt);
  }
};


// remove keys from follow list
  
aa.u.unfollow =async s=>
{
  console.log('unfollows',s)
  if (!aa.u.o.ls.xpub) 
  {
    aa.log('no u found, set one first')
    return false;
  }
  
  let dat_k3 = await aa.p.get_k3();
  if (!dat_k3) return false;
  
  aa.cli.fuck_off();
  let keys_to_unfollow = s.trim().split(' ');
  let new_follows = [...dat_k3.event.tags];
  const old_len = new_follows.length;
  let ul = aa.mk.l('ul',{cla:'list removed_tags'});
  for (const k of keys_to_unfollow)
  {
    if (k.startsWith('npub')) k = aa.fx.decode(k);
    if (aa.is.x(k)) 
    {
      ul.append(aa.mk.l('li',{con:k,cla:'disabled'}));
      new_follows = new_follows.filter(p=>p[1]!==k);
      aa.p.score(k+' 0');
    }
    else aa.log('invalid pubkey to unfollow')
  }

  if (new_follows.length)
  {
    const l = aa.mk.l('div',{cla:'wrap'});
    l.append(aa.mk.tag_list(new_follows),ul);
    // console.log(new_follows);
    aa.confirm(
    {
      title:'new follow list:'+old_len+'->'+new_follows.length,
      l:l,
      scroll:true,
      no:{ exe:()=>{} },
      yes:{ exe:()=>
      {
        const event = 
        {
          pubkey:aa.u.o.ls.xpub,
          kind:3,
          created_at:aa.t.now(),
          content:dat_k3.event.content,
          tags:new_follows
        };
        aa.e.finalize_event(event).then(e=>{console.log('sent')});
      }},
    });
  }
};


// web of trust 

aa.u.wot =async()=>
{
  let ff = {};
  let to_get = [];
  let bff = aa.u?.extradata.bff;
  if (!bff?.length) return false;  
  for (const x of bff)
  {
    let p = aa.db.p[x];
    let p_bff = p?.extradata.bff;
    if (p_bff?.length)
    {      
      for (const xid of p_bff)
      {
        if (!aa.u.is_following(xid))
        {
          if (!ff[xid]) ff[xid] = [];
          aa.fx.a_add(ff[xid],[x]);
          if (!aa.db.p[xid]) aa.fx.a_add(to_get,[xid]);
        }
      }
    }
  }

  if (to_get.length)
  {
    // let found = 0;
    let dat = await aa.db.idb.ops({get_a:{store:'authors',a:to_get}});
    // console.log('dat',dat);
    if (dat) for (const p of dat) aa.db.p[p.xpub] = p;
  }
  
  aa.ff = ff;
  let wot = {};
  let sorted = Object.entries(aa.ff).sort((a,b)=>b[1].length - a[1].length);
  for (const f of sorted)
  {
    let x = f[0];
    let n = f[1].length;
    let id = aa.db.p[x]?.extradata.petnames[0] || aa.db.p[x]?.metadata?.name || x;
    wot[id] = n;
  }

  return wot
};


// encrypted direct message

aa.kinds[4] =dat=>
{
  let note = aa.e.note_default(dat);
  let content = note.querySelector('.content');
  if (!dat.clas.includes('draft'))
  {
    content.classList.add('encrypted');
    content.querySelector('.paragraph').classList.add('cypher');
    note.querySelector('.actions .butt.react').remove();
    note.querySelector('.actions .butt.req').remove();
  }
  let u_x = aa.u.o.ls.xpub;
  let p_x = aa.get.tags(dat.event,'p')[0][1];
  if (u_x === p_x)
  {
    note.classList.add('for_u');
    content.append(aa.mk.butt_action('e decrypt '+dat.event.id,'decrypt'));
  }
  return note
};

window.addEventListener('load',aa.u.load);