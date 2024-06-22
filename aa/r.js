// relay stuff

aa.r = 
{
  def:{id:'r',ls:{},r:'read',w:'write'}, 
  active:{},
  message_type:{},
  old_id:'rel',
  sn:'r'
};

// add relays

aa.r.add =s=>
{ 
  // aa.cli.fuck_off();
  aa.cli.clear();
  
  const work =a=>
  {
    let url_string = a.shift().trim();
    const url = aa.is.url(url_string)?.href;
    if (url)
    {
      if (!aa.r.o.ls[url]) aa.r.o.ls[url] = {sets:[]};
      aa.fx.a_add(aa.r.o.ls[url].sets,a);
      aa.mod_ui(aa.r,url,aa.r.o.ls[url]);
    }
  };
  aa.fx.loop(work,s);
  aa.mod_save(aa.r);
};


// hint notice

aa.r.hint_notice =(url,opts)=> // if (!aa.r.o.ls[url])
{
  //    needs to display info from what npub
  let act_yes = url+' hint';
  let notice = {title:'r add '+act_yes+'?'};
  notice.yes =
  {
    title:'yes',
    exe:e=>
    {
      console.log(url,opts);
      aa.r.add(act_yes);
      aa.r.c_on(url,opts);
      e.target.parentElement.textContent = act_yes;
    }
  };
  let act_no = url+' off';
  notice.no =
  {
    title:'no',
    exe:e=>
    {
      aa.r.add(act_no);
      e.target.parentElement.textContent = act_no;
    }
  };
  aa.notice(notice);
}


// add relays from object

aa.r.add_from_o =(relays)=>
{
  let a = [];
  for (const r in relays) a.push(r+' '+relays[r].sets.join(' '));
  if (a.length) aa.r.add(a.join(',')); 
  aa.log(a.length+' relays added');
};


// add relays to person (needs to move to p file)

aa.r.add_to_p =(relays,p)=>
{
  if (!p.rels) p.rels = {};
  for (const relay in relays)
  {
    if (!p.rels[relay]) p.rels[relay] = relays[relay]
    else aa.fx.a_add(p.rels[relay].sets,relays[relay].sets);
  }
};


// post event to relays

aa.r.broadcast =(event,relays=false)=>
{
  const dis = JSON.stringify(['EVENT',event]);
  if (!relays || !relays.length) relays = aa.r.in_set(aa.r.o.w);
  if (relays && relays.length)
  {
    for (const k of relays)
    {
      const relay = aa.r.active[k];
      if (relay?.ws?.readyState === 1) relay.ws.send(dis);
      else
      {
        if (!aa.r.o.ls[k]) aa.r.add(k+' write');
        aa.r.c_on(k,{send:[dis]});
      }
    }
  }
};


// append relay buttons to item

aa.r.butts =(l,o)=>
{
  let url = l.querySelector('.url').innerText;
  l.append(aa.mk.butt_action(aa.r.sn+' rm '+url,'rm','rm'));
  
  let sets = aa.mk.l('span',{cla:'sets'});
  if (o.sets && o.sets.length)
  {    
    for (const set of o.sets)
    {
      sets.append(aa.mk.butt_action(aa.r.sn+' setrm '+set+' '+url,set))
    }
  }
  sets.append(aa.mk.butt_action(aa.r.sn+' sets off '+url,'+'));
  l.append(sets);
};


// connect to relay

aa.r.c_on =(url,o=false)=> 
{
  let r = aa.r.o.ls[url];

  if (localStorage.mode === 'hard') 
  {
    aa.log('aa.r.c_on: mode=hard');
    return
  }
  
  if (aa.r.o.ls[url].sets.includes('off')) 
  {
    aa.r.force_close([url]);
    return
  }

  let relay = aa.r.active[url] ? aa.r.active[url] : aa.r.active[url] = {q:{},cc:[]};
  if (relay.ws?.readyState !== 1)
  {
    if (relay.fc) delete relay.fc;
    if (o)
    {
      if (o.req?.length) relay.q[o.req[1]] = o;
      if (o.send?.length) relay.send = o.send;
    }
    
    relay.ws = new WebSocket(url);
    relay.ws.onopen = aa.r.ws_open;
    relay.ws.onclose = aa.r.ws_close;
    relay.ws.onmessage = aa.r.ws_message;
    relay.ws.onerror = aa.r.ws_error;
  }
};


// close relay

aa.r.close =(k,id)=>
{
  let r = aa.r.active[k];
  if (r && r.q[id])
  {
    if (r.ws?.readyState === 1) r.ws.send(JSON.stringify(['CLOSE',id]));
    setTimeout(()=>
    {
      delete r.q[id];
      aa.r.upd_state(k);
      aa.log('r close '+k+' '+id);
    },500);
  }
};


// request from relays

aa.r.demand =(request,relays,options)=>
{
  // console.log('aa.r.demand',{request:request,relays:relays,options:options});

  if (!request || !Array.isArray(request)) 
  {
    aa.log('aa.r.demand: !request');
    return false
  }

  let filters = request.slice(2);
  if (!aa.fx.verify_req_filters(filters))
  {
    aa.log('aa.r.demand: invalid filter '+JSON.stringify(f));
    return false;
  }

  if (!relays?.length) relays = aa.r.in_set(aa.r.o.r);
  if (!relays.length) 
  {
    aa.log('aa.r.demand: no relays')
    return false;
  }

  let opts = {req:request};
  for (const opt in options) opts[opt] = options[opt];

  

  for (const k of relays)
  {
    let url = aa.is.url(k)?.href;
    if (!url) 
    {
      aa.log('invalid relay url: '+k);
      return false
    }

    const rel_active = aa.r.active[url];
    if (!rel_active)
    {
      if (!aa.r.o.ls[url]) aa.r.hint_notice(url,opts)
      else 
      {
        if (!aa.r.o.ls[url].sets.includes('off')) aa.r.c_on(url,opts);
        else aa.log('aa.r.demand: '+url+' is off');
      } 
    }
    else 
    {
      let no_active_connection = !rel_active.ws || !rel_active.ws?.readyState === 3;
      if (no_active_connection) aa.r.c_on(url,opts);
      else 
      {
        if (opts)
        {
          if (opts.req?.length) rel_active.q[opts.req[1]] = opts;
          if (opts.send?.length) rel_active.send = opts.send;
        }
        aa.r.try(rel_active,JSON.stringify(request));
      }
    }
  }
};


// get relays from extension (nip7)

aa.r.ext =async()=>
{
  return new Promise(resolve=>
  {
    if (window.nostr) 
    {
      window.nostr.getRelays().then(r=>
      {
        aa.r.add_from_o(aa.r.from_o(r,['ext']));
        resolve('rel ext done');
      });
    } 
    else 
    {
      aa.log('no extension found, make sure it is enabled.');
      resolve('rel ext done');
    }
  });
};

// force close relay

aa.r.force_close =(a=[])=>
{
  for (const k of a)
  {
    let r = aa.r.active[k];
    if (r && r.ws)
    {
      r.fc = true; 
      r.ws.close(); 
      delete r.ws;
    }
  }
};


// returns relays object from object (extension,k3)

aa.r.from_o =(o,sets=false)=>
{
  let relays = {};
  for (let url in o)
  {
    const href = aa.is.url(url)?.href;
    if (href)
    {
      relays[href] = {sets:[]};
      if (o[url].read === true) aa.fx.a_add(relays[href].sets,['read']);
      if (o[url].write === true) aa.fx.a_add(relays[href].sets,['write']);
      if (Array.isArray(sets)) aa.fx.a_add(relays[href].sets,sets);
    }
  }
  return relays
}

// returns relays object from tags array (kind-10002,etc..)

aa.r.from_tags =(tags,sets=[])=>
{
  let relays = {};
  for (const tag of tags)
  {
    const [type,url,permission] = tag;
    const href = aa.is.url(url)?.href;
    if (href)
    {
      let relay = relays[href] = {sets:[]};
      if (permission === 'read') aa.fx.a_add(relay.sets,[...sets,'read']);
      else if (permission === 'write') aa.fx.a_add(relay.sets,[...sets,'write']);
      else aa.fx.a_add(relay.sets,[...sets,'read','write']);
    }
  }
  return relays
}


// returns relays in a given set

aa.r.in_set =(relset,filter=true)=>
{
  let relays = [];
  for (const k in aa.r.o.ls)
  { 
    if (aa.r.o.ls[k].sets.includes(relset))
    {
      if (!filter) relays.push(k);
      else if (!aa.r.o.ls[k].sets.includes('off')) relays.push(k);
    } 
  }
  return relays
};



// list relays from set

aa.r.list =s=>
{
  const err = ()=> {aa.log(aa.r.sn+' ls: no relays found')};
  a = s.trim().split(' ');
  if (!a.length || a[0] === '') a[0]= 'k10002';
  let relays = [];
  for (const set of a) relays.push(...aa.r.in_set(set,false));
  relays = [...new Set(relays)];
  // console.log(relays);
  let rels = [];
  if (relays.length)
  {
    for (const k of relays)
    { 
      let read, write;
      const tag = [k];
      if (aa.r.o.ls[k].sets.includes('read')) read = true;
      if (aa.r.o.ls[k].sets.includes('write')) write = true;
      if (read && !write) tag.push('read');
      if (!read && write) tag.push('write');
      rels.push(tag.join(' '))
    }
  }
  if (rels.length) aa.cli.v(localStorage.ns+' '+aa.r.sn+' mkls '+rels);
  else err();
};


// make relay list

aa.r.list_mk =s=>
{
  // aa.cli.fuck_off();
  aa.cli.clear();
  const a = s.trim().split(',');
  const relays = [];
  for (const r of a) 
  {
    let relay = r.split(' ');
    relay.unshift('r');
    relays.push(relay);
  }
  if (relays.length)
  {
    aa.confirm(
    {
      title:'new relay list',
      l:aa.mk.tag_list(relays),
      no:{exe:()=>{} },
      yes:{exe:()=>
      {
        const event = 
        {
          pubkey:aa.u.o.ls.xpub,
          kind:10002,
          created_at:aa.t.now(),
          content:'',
          tags:relays
        };
        aa.e.finalize_event(event);
      }},
    });
  }
};


// on load

aa.r.load =()=>
{
  // relay actions
  aa.actions.push(
    {
      action:[aa.r.sn,'add'],
      required:['url'], 
      optional:['set'], 
      description:'add or replace relays',
      exe:aa.r.add
    },
    {
      action:[aa.r.sn,'rm'],
      required:['url'], 
      description:'remove relay',
      exe:aa.r.rm
    },
    {
      action:[aa.r.sn,'sets'],
      required:['set','url'],
      description:'create sets of relays',
      exe:aa.r.sets
    },
    {
      action:[aa.r.sn,'setrm'],
      required:['set'],
      optional:['url'],
      description:'remove set from relays',
      exe:aa.r.set_rm
    },
    {
      action:[aa.r.sn,'ext'],
      description:'get relays from extension',
      exe:aa.r.ext
    },
    {
      action:[aa.r.sn,'ls'],
      required:['set'],
      description:'loads relay list from sets',
      exe:aa.r.list
    },
    {
      action:[aa.r.sn,'mkls'],
      description:'create a relay list (kind-10002)',
      exe:aa.r.list_mk
    },
  );

  aa.mod_load(aa.r).then(aa.mk.mod);
}


// relay message types

// ["AUTH", <challenge-string>]
aa.r.message_type.auth =message=> 
{
  console.log(message)
};

// ["CLOSED",<sub_id>,<message>]
aa.r.message_type.closed =message=> 
{
  console.log(message)
};

// ["EOSE",<sub_id>]
aa.r.message_type.eose =message=>
{
  const sub_id = message.data[1];
  let sub = aa.r.active[message.origin].q[sub_id];
  if (sub?.eose === 'close') aa.r.close(message.origin,sub_id);
};

// ["EVENT",<sub_id>,<event_data>]
aa.r.message_type.event =message=>
{ 
  const sub_id = message.data[1];
  const event = message.data[2];

  if (aa.fx.verify_event(event)) 
  {
    const dat = 
    {
      event:event,
      seen:[message.origin],
      subs:[sub_id],
      clas:[],
      refs:[]
    };
    if (aa.miss.e[event.id]) delete aa.miss.e[event.id];
    aa.db.upd_e(dat);
    if (dat.subs?.length && dat.seen?.length)
    {
      let sub = aa.r.active[dat.seen[0]]?.q[dat.subs[0]];
      if (sub && !sub?.stamp || sub?.stamp < dat.event.created_at) sub.stamp = dat.event.created_at;
    }
    
    aa.e.print(dat);
  }
  else console.log('invalid event',message);
};

// ["NOTICE",,<message>]
aa.r.message_type.notice =message=> 
{
  console.log(message)
};

// ["OK",<event_id>,<true|false>,<message>]
aa.r.message_type.ok =message=>
{
  const [type,id,is_ok,reason] = message.data;
  if (is_ok) 
  {
    console.log('ok',id,message.origin);
    let dat = aa.db.e[id];
    dat.clas = aa.fx.a_rm(dat.clas,['not_sent','draft']);
    aa.fx.a_add(dat.seen,[message.origin]);
    aa.db.upd_e(dat);

    const l = document.getElementById(aa.fx.encode('nid',id));
    if (l) 
    {
      l.classList.remove('not_sent','draft');
      aa.fx.dataset_add(l,'seen',[message.origin]);
      let actions = l.querySelector('.actions');
      actions.replaceWith(aa.e.note_actions(dat.clas))
    }
  }
  else aa.log(message.origin+' not ok: '+reason+' '+id);
};

// make mod item

aa.r.mk =(k,v) =>
{
  // k = url, v = {sets:[]}
  const l = aa.r.mk_item(k,v);
  if (l)
  {
    l.id = aa.r.def.id+'_'+aa.fx.an(k);
    l.dataset.state = 0;
    aa.r.butts(l,v);
    aa.r.upd_state(k);
    // setTimeout(()=>{aa.r.upd_state(k)},200);
    return l
  }
  else return false
};


// make relay item

aa.r.mk_item =(k,v)=>
{
  k = aa.is.url(k);
  if (!k) return false;

  const l = aa.mk.l('li',{cla:'item relay'});
  const url_l = aa.mk.l('p',{cla:'url'});
  url_l.append(
    aa.mk.l('span',{cla:'protocol',con:k.protocol+'//'}),
    aa.mk.l('span',{cla:'host',con:k.host}),
    aa.mk.l('span',{cla:'pathname',con:k.pathname}),
    aa.mk.l('span',{cla:'hashsearch',con:k.hash+k.search})
  ); 
  l.append(url_l); 
  if (v.sets && v.sets.length) l.dataset.sets = v.sets;   
  return l
};


// returns a list of relays given either a relay set or single url

aa.r.rel =s=>
{
  const a = [];
  let relay = aa.is.url(s)?.href;
  if (relay) a.push(relay);
  else a.push(...aa.r.in_set(s));
  return a
};


// remove relay

aa.r.rm =s=>
{
  aa.cli.clear();
  const work =a=>
  {
    for (let url of a)
    {
      url = aa.is.url(url)?.href;
      if (url)
      {
        if (aa.r.o.ls[url])
        {
          if (aa.r.active[url])
          {
            aa.r.force_close([url]);
            delete aa.r.active[url];
          }
          delete aa.r.o.ls[url]
        }
      }
    }
  };
  aa.fx.loop(work,s,aa.r.save);
};


// resume subscriptions

aa.r.resume =()=>{ for (const url in aa.r.active) { aa.r.c_on(url) } };


// save

aa.r.save =()=>
{ 
  aa.mod_save(aa.r)
  .then(aa.mk.mod) 
};


// add set to relays

aa.r.sets =s=>
{
  const work =a=>
  {
    const set_id = a.shift();
    if (aa.is.an(set_id)) 
    {
      for (let url of a)
      {
        url = aa.is.url(url)?.href;
        if (url)
        {
          if (!aa.r.o.ls[url].sets) aa.r.o.ls[url].sets = [];
          aa.fx.a_add(aa.r.o.ls[url].sets,[set_id]);
          aa.mod_ui(aa.r,url,aa.r.o.ls[url]);
        }
      }
    }
  };

  aa.fx.loop(work,s);
  aa.mod_save(aa.r)
  aa.cli.clear();
};


// remove set from relays
aa.r.set_rm =s=>
{
  const work =a=>
  {
    const set_id = a.shift();
    if (aa.is.an(set_id)) 
    {
      for (let url of a)
      {
        url = aa.is.url(url)?.href;
        if (url)
        {
          let r = aa.r.o.ls[url];
          if (r && r.sets.includes(set_id))
          {
            r.sets = r.sets.filter(set=> set !== set_id)
          }
        }
      }
    }
  };
  aa.fx.loop(work,s,aa.r.save);
  aa.cli.clear();
};

// try to send and retry if fails

aa.r.try =(relay,dis)=>
{
  if (relay.ws.readyState === 1) relay.ws.send(dis);
  else 
  {
    if (!relay.failed_cons) relay.failed_cons = 0; 
    relay.failed_cons = relay.failed_cons++;
    if (relay.failed_cons < 10) setTimeout(()=>{aa.r.try(relay,dis)},500)
  }
  aa.r.upd_state(relay.ws.url);
};


// update relay state in ui

aa.r.upd_state =url=>
{
  const relay = aa.r.active[url];
  if (relay)
  {
    let l = document.getElementById(aa.r.def.id+'_'+aa.fx.an(url));
    if (l)
    {
      setTimeout(()=>
      {
        l.dataset.state = relay?.ws?.readyState ||  '';
        l.dataset.q = Object.keys(relay.q);
        // console.log('aa.r.upd_state '+url,l.dataset.state,l.dataset.q);
      },100);
    }
    else console.log('aa.r.upd_state '+url,'no relay found')
  }
};


// on websocket close

aa.r.ws_close =async e=>
{
  const rl = e.target.url;
  let relay = aa.r.active[rl];
  aa.r.upd_state(e.target.url);
  
  if (relay && !relay.fc) 
  {
    let cc = relay.cc;
    const fails = cc.unshift(Math.floor(e.timeStamp));
    // reconnect if somewhat stable
    if (cc[1] && cc[0] - cc[1] > 99999 || fails < 21) 
    {  
      setTimeout(()=>{ aa.r.c_on(rl) }, 420 * fails)
    }
  } else aa.log(rl+' closed');
};


// on websocket error

aa.r.ws_error =e=>{ console.log('ws error:',e) };


// on websocket message

aa.r.ws_message =e=>
{
  const err = ()=> 
  { 
    aa.log('invalid data from '+e.target.url);
    console.log('invalid data from '+e.target.url,e);
  };

  let a = aa.parse.j(e.data);
  if (a && Array.isArray(a))
  {
    let type = a[0].toLowerCase();
    if (aa.r.message_type.hasOwnProperty(type))
    {
      aa.r.message_type[type]({data:a,origin:e.target.url});
    } 
    else err();
  }
  else err();
};

// on websocket open

aa.r.ws_open =async e=>
{
  let relay = aa.r.active[e.target.url];
  for (const sub_id in relay.q)
  {
    let sub = relay.q[sub_id];
    if (sub?.eose !== 'done')
    {
      if (sub.stamp)
      {
        let filters_i = 2;
        while (filters_i < sub.req.length)
        {
          sub.req[filters_i].since = sub.stamp + 1;
          filters_i++;
        }
      }
      aa.r.try(relay,JSON.stringify(sub.req))
    }
  }
  if (relay.send?.length) for (const ev of relay.send) aa.r.try(relay,ev);
  aa.r.upd_state(e.target.url);
};