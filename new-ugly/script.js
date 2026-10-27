/* ===== 頁面行為 ===== */

// 桌機版以 1145px 為設計寬度，依螢幕寬度等比放大縮小（對應 CSS 的桌機版區塊）
function fitToScreen() {
  var w = document.documentElement.clientWidth;
  document.body.style.zoom = w >= 900 ? (w / 1145) : '';
}
fitToScreen();
window.addEventListener('resize', fitToScreen);

// 導覽列按鈕：平滑捲動到對應區塊
document.querySelectorAll('.menu a').forEach(function (link) {
  link.addEventListener('click', function (e) {
    var target = document.querySelector(link.getAttribute('href'));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});

// 左上角 NEW UGLY：回到首頁
var logo = document.querySelector('.logo');
function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
logo.addEventListener('click', scrollToTop);
logo.addEventListener('keydown', function (e) {
  if (e.key === 'Enter') scrollToTop();
});

// 「那是什麼？」卡片右上角的 ✕：先收起來，約 2 秒後再出現
document.querySelectorAll('.bar button').forEach(function (btn) {
  btn.addEventListener('click', function () {
    var card = btn.closest('.win');
    card.classList.add('gone');
    setTimeout(function () { card.classList.remove('gone'); }, 1800);
  });
});

/* ===== 換你！編輯器 ===== */
function initEditor() {
  var cv=document.getElementById('cv');
  if(!cv)return;
  var cx=cv.getContext('2d'),
      W=cv.width,
      H=cv.height,
      TAU=Math.PI*2,
      objs=[],
      sel=null,
      bgI=0,
      out=false,
      lastPhoto=null,
      color='#ff3b3b',
      drag=null,
      TF='900 90px "Noto Sans TC",sans-serif';
  function $(s){
    return document.querySelector(s)
  }
  function msg(t){
    var m=$('#msg');
    m.textContent=t;
    clearTimeout(msg.t);
    msg.t=setTimeout(function(){
      m.textContent=''
    },3500)
  }

  // 背景：8 種背景的繪製方式
  function drawBG(g,w,h,i){
    g.save();
    if(i===0){
      g.fillStyle='#fff3a0';
      g.fillRect(0,0,w,h);
      [[0,0,.5,'255,255,255'],[.55,.75,.45,'255,255,255'],[1,1,.55,'132,224,42']].forEach(function(a){
        var gr=g.createRadialGradient(a[0]*w,a[1]*h,0,a[0]*w,a[1]*h,a[2]*w);
        gr.addColorStop(0,'rgba('+a[3]+',1)');
        gr.addColorStop(1,'rgba('+a[3]+',0)');
        g.fillStyle=gr;
        g.fillRect(0,0,w,h)
      })
    } else if(i===1){
      g.fillStyle='#ff66dd';
      g.fillRect(0,0,w,h);
      var r=g.createRadialGradient(w*.2,0,0,w*.2,0,w*.6);
      r.addColorStop(0,'rgba(255,255,255,.9)');
      r.addColorStop(1,'rgba(255,255,255,0)');
      g.fillStyle=r;
      g.fillRect(0,0,w,h)
    } else if(i===2){
      var s=g.createLinearGradient(0,0,0,h*.7);
      s.addColorStop(0,'#2f6fd6');
      s.addColorStop(1,'#bfe3ff');
      g.fillStyle=s;
      g.fillRect(0,0,w,h);
      g.fillStyle='#2b8a1f';
      g.beginPath();
      g.ellipse(w*.3,h*1.08,w*.85,h*.55,0,0,TAU);
      g.fill();
      g.fillStyle='#3aa02a';
      g.beginPath();
      g.ellipse(w*.95,h*1.1,w*.6,h*.4,0,0,TAU);
      g.fill()
    } else if(i===3){
      var q=w/12;
      for(var y=0;y*q<h;y++)for(var x=0;x<12;x++){
        g.fillStyle=(x+y)%2?'#ff3b30':'#ffe600';
        g.fillRect(x*q,y*q,q+1,q+1)
      }
    } else if(i===4){
      g.fillStyle='#ffe600';
      g.fillRect(0,0,w,h);
      g.translate(w/2,h/2);
      g.rotate(-.5);
      g.fillStyle='#3b7bff';
      var t=w/10;
      for(var k=-w;k<w;k+=t*2)g.fillRect(k,-h,t,h*2)
    } else if(i===5){
      var l=g.createLinearGradient(0,0,0,h);
      l.addColorStop(0,'#e6ffe6');
      l.addColorStop(.55,'#4dff7a');
      l.addColorStop(1,'#e8ffee');
      g.fillStyle=l;
      g.fillRect(0,0,w,h)
    } else if(i===6){
      g.fillStyle='#ff2d2d';
      g.fillRect(0,0,w,h);
      g.fillStyle='#ffe600';
      var d=w/8;
      for(var yy=d/2;yy<h;yy+=d)for(var xx=d/2;xx<w;xx+=d){
        g.beginPath();
        g.arc(xx,yy,d/5,0,TAU);
        g.fill()
      }
    } else{
      g.fillStyle='#fff';
      g.fillRect(0,0,w,h);
      g.strokeStyle='#bbb';
      g.lineWidth=1;
      var m=w/12;
      for(var a=0;a<w;a+=m){
        g.beginPath();
        g.moveTo(a,0);
        g.lineTo(a,h);
        g.stroke()
      }
      for(var b=0;b<h;b+=m){
        g.beginPath();
        g.moveTo(0,b);
        g.lineTo(w,b);
        g.stroke()
      }
    }
    g.restore()
  }

  // 色塊：各種形狀的路徑
  function path(g,k,s){
    if(k==='circle')g.arc(0,0,s,0,TAU);
    else if(k==='square')g.rect(-s,-s,2*s,2*s);
    else if(k==='triangle'){
      g.moveTo(0,-s);
      g.lineTo(s,s*.8);
      g.lineTo(-s,s*.8)
    } else if(k==='heart'){
      g.moveTo(0,s*.9);
      g.bezierCurveTo(-s*1.3,s*.1,-s*.8,-s*.9,0,-s*.35);
      g.bezierCurveTo(s*.8,-s*.9,s*1.3,s*.1,0,s*.9)
    } else{
      var n=k==='star'?5:12,ri=k==='star'?.42:.72;
      for(var i=0;i<n*2;i++){
        var a=Math.PI*i/n-Math.PI/2,r=i%2?s*ri:s;
        g[i?'lineTo':'moveTo'](r*Math.cos(a),r*Math.sin(a))
      }
    }
  }

  // 色塊：填色 + 黑色描邊
  function shape(g,k,c,s){
    g.beginPath();
    path(g,k,s);
    g.closePath();
    g.fillStyle=c;
    g.fill();
    g.lineWidth=s*.07;
    g.strokeStyle='#000';
    g.lineJoin='round';
    g.stroke()
  }

  // 把圖片染成單一顏色（做貼紙白邊用）
  function tint(c,col){
    var t=document.createElement('canvas');
    t.width=c.width;
    t.height=c.height;
    var g=t.getContext('2d');
    g.drawImage(c,0,0);
    g.globalCompositeOperation='source-in';
    g.fillStyle=col;
    g.fillRect(0,0,t.width,t.height);
    return t
  }

  // 處理圖片：裁切、新醜風上色、白色貼紙邊
  function build(o){
    var s=o.src,
        sw=s.naturalWidth||s.width,
        sh=s.naturalHeight||s.height,
        m=o.photo?560:320,
        k=Math.min(1,m/Math.max(sw,sh)),
        c=document.createElement('canvas'),
        g;
    if(o.photo&&o.crop==='circle'){
      var mn=Math.min(sw,sh),d=Math.round(mn*k);
      c.width=c.height=d;
      g=c.getContext('2d');
      g.beginPath();
      g.arc(d/2,d/2,d/2,0,TAU);
      g.clip();
      g.drawImage(s,(sw-mn)/2,(sh-mn)/2,mn,mn,0,0,d,d)
    } else{
      c.width=Math.round(sw*k);
      c.height=Math.round(sh*k);
      g=c.getContext('2d');
      g.drawImage(s,0,0,c.width,c.height)
    }
    if(o.photo&&o.style!=='raw'){
      var id=g.getImageData(0,0,c.width,c.height),p=id.data;
      for(var i=0;i<p.length;i+=4){
        if(!p[i+3])continue;
        var r=p[i],gg=p[i+1],b=p[i+2],l=.3*r+.59*gg+.11*b;
        if(o.style==='pink'){
          var v=Math.min(1,Math.max(0,(l/255-.5)*1.5+.5)),
              lo=v<.55,
              t=lo?v/.55:(v-.55)/.45,
              A=lo?[58,0,48]:[255,63,180],
              B=lo?[255,63,180]:[255,214,240];
          p[i]=A[0]+(B[0]-A[0])*t;
          p[i+1]=A[1]+(B[1]-A[1])*t;
          p[i+2]=A[2]+(B[2]-A[2])*t
        } else{
          r=l+(r-l)*2.2;
          gg=l+(gg-l)*2.2;
          b=l+(b-l)*2.2;
          p[i]=Math.min(255,Math.max(0,(r-128)*1.2+128));
          p[i+1]=Math.min(255,Math.max(0,(gg-128)*1.2+128));
          p[i+2]=Math.min(255,Math.max(0,(b-128)*1.2+128))
        }
      }
      g.putImageData(id,0,0)
    }
    o.cv=c;
    if(o.bd){
      var pad=18,w=c.width+pad*2,h=c.height+pad*2,e=document.createElement('canvas');
      e.width=w;
      e.height=h;
      var eg=e.getContext('2d'),bl=tint(c,'#000'),wh=tint(c,'#fff');
      for(var a=0;a<16;a++){
        var an=a/16*TAU;
        eg.drawImage(bl,pad+Math.cos(an)*12,pad+Math.sin(an)*12)
      }
      for(var a2=0;a2<16;a2++){
        var an2=a2/16*TAU;
        eg.drawImage(wh,pad+Math.cos(an2)*8,pad+Math.sin(an2)*8)
      }
      o.ol=e
    }
  }

  // 物件的大小範圍（用來點選與畫選取框）
  function ext(o){
    if(o.t==='s')return[100,100];
    if(o.t==='i'){
      var c=o.bd?o.ol:o.cv;
      return[c.width/2,c.height/2]
    }
    cx.save();
    cx.font=TF;
    var w=cx.measureText(o.txt).width;
    cx.restore();
    return[w/2+14,58]
  }

  // 畫出一個物件
  function drawObj(o){
    cx.save();
    cx.translate(o.x,o.y);
    cx.rotate(o.r*Math.PI/180);
    cx.scale(o.sc,o.sc);
    if(o.t==='i'){
      if(o.bd)cx.drawImage(o.ol,-o.ol.width/2,-o.ol.height/2);
      cx.drawImage(o.cv,-o.cv.width/2,-o.cv.height/2)
    } else if(o.t==='s')shape(cx,o.k,o.c,100);
    else{
      cx.font=TF;
      cx.textAlign='center';
      cx.textBaseline='middle';
      cx.lineJoin='round';
      cx.lineWidth=28;
      cx.strokeStyle='#fff';
      cx.strokeText(o.txt,0,0);
      cx.lineWidth=12;
      cx.strokeStyle='#000';
      cx.strokeText(o.txt,0,0);
      cx.fillStyle=o.c;
      cx.fillText(o.txt,0,0)
    }
    cx.restore()
  }

  // 重新畫整張畫布
  function render(){
    drawBG(cx,W,H,bgI);
    objs.forEach(drawObj);
    if(!objs.length&&!out){
      cx.fillStyle='rgba(0,0,0,.55)';
      cx.font='500 28px "Noto Sans TC",sans-serif';
      cx.textAlign='center';
      cx.fillText('按 UPLOAD 上傳照片，或點左邊的貼紙',W/2,H/2)
    }
    if(sel&&!out){
      var b=ext(sel);
      cx.save();
      cx.translate(sel.x,sel.y);
      cx.rotate(sel.r*Math.PI/180);
      cx.setLineDash([10,7]);
      cx.lineWidth=3;
      cx.strokeStyle='#0a0adc';
      cx.strokeRect(-b[0]*sel.sc,-b[1]*sel.sc,b[0]*2*sel.sc,b[1]*2*sel.sc);
      cx.restore()
    }
  }

  // 判斷滑鼠點到哪個物件
  function hit(p){
    for(var i=objs.length-1;i>=0;i--){
      var o=objs[i],
          b=ext(o),
          dx=p[0]-o.x,
          dy=p[1]-o.y,
          a=-o.r*Math.PI/180,
          lx=(dx*Math.cos(a)-dy*Math.sin(a))/o.sc,
          ly=(dx*Math.sin(a)+dy*Math.cos(a))/o.sc;
      if(Math.abs(lx)<=b[0]&&Math.abs(ly)<=b[1])return o
    }
    return null
  }

  // 同步下方的大小/旋轉滑桿
  function sync(){
    var on=!!sel;
    ['#sz','#rt','#fw','#bk','#rm'].forEach(function(s){
      $(s).disabled=!on
    });
    if(on){
      $('#sz').value=sel.sc;
      $('#rt').value=sel.r
    }
  }

  // 把物件加進畫布
  function add(o){
    o.x=W/2+(objs.length%5)*22-44;
    o.y=H/2+(objs.length%4)*18-27;
    o.r=0;
    objs.push(o);
    sel=o;
    sync();
    render()
  }

  // 加入圖片或貼紙
  function addImg(src,photo){
    var o={t:'i',src:src,photo:photo,style:'pink',crop:'rect',bd:true};
    build(o);
    o.sc=(photo?400:220)/Math.max(o.cv.width,o.cv.height);
    if(photo)lastPhoto=o;
    add(o)
  }

  // 滑鼠位置 → 畫布座標
  function pt(e){
    var r=cv.getBoundingClientRect();
    return[(e.clientX-r.left)*W/r.width,(e.clientY-r.top)*H/r.height]
  }
  cv.addEventListener('pointerdown',function(e){
    var p=pt(e),o=hit(p);
    sel=o;
    if(o){
      drag=[p[0]-o.x,p[1]-o.y];
      cv.setPointerCapture(e.pointerId)
    }
    sync();
    render()
  });
  cv.addEventListener('pointermove',function(e){
    if(!drag||!sel)return;
    var p=pt(e);
    sel.x=p[0]-drag[0];
    sel.y=p[1]-drag[1];
    render()
  });
  ['pointerup','pointercancel'].forEach(function(n){
    cv.addEventListener(n,function(){
      drag=null
    })
  });
  $('#sz').addEventListener('input',function(e){
    if(sel){
      sel.sc=+e.target.value;
      render()
    }
  });
  $('#rt').addEventListener('input',function(e){
    if(sel){
      sel.r=+e.target.value;
      render()
    }
  });
  $('#fw').onclick=function(){
    if(sel){
      objs.splice(objs.indexOf(sel),1);
      objs.push(sel);
      render()
    }
  };
  $('#bk').onclick=function(){
    if(sel){
      objs.splice(objs.indexOf(sel),1);
      objs.unshift(sel);
      render()
    }
  };

  // 刪除選取的物件
  function del(){
    if(sel){
      objs.splice(objs.indexOf(sel),1);
      sel=null;
      sync();
      render()
    }
  }
  $('#rm').onclick=del;
  document.addEventListener('keydown',function(e){
    if((e.key==='Delete')&&sel&&!/INPUT|TEXTAREA/.test(document.activeElement.tagName))del()
  });

  // 切換左邊面板的頁籤
  function tab(n){
    document.querySelectorAll('.tabs .pill').forEach(function(b){
      b.classList.toggle('on',b.dataset.p===n)
    });
    document.querySelectorAll('.panel').forEach(function(p){
      p.hidden=p.id!=='p-'+n
    })
  }
  document.querySelectorAll('.tabs .pill').forEach(function(b){
    b.onclick=function(){
      tab(b.dataset.p)
    }
  });
  document.querySelectorAll('#p-face .pill').forEach(function(b){
    b.onclick=function(){
      var o=(sel&&sel.photo)?sel:lastPhoto;
      if(!o){
        msg('先按 UPLOAD 上傳一張照片');
        return
      }
      var k=b.dataset.k,v=b.dataset.v;
      o[k]=k==='bd'?v==='1':v;
      build(o);
      b.parentNode.querySelectorAll('.pill').forEach(function(x){
        x.classList.toggle('on',x===b)
      });
      render()
    }
  });

  // 建立左邊面板的小縮圖按鈕
  function swatch(box,fn,w,h,draw){
    var b=document.createElement('button');
    var c=document.createElement('canvas');
    c.width=w;
    c.height=h;
    draw(c.getContext('2d'),w,h);
    b.appendChild(c);
    b.onclick=fn;
    box.appendChild(b)
  }
  for(var i=0;i<8;i++)(function(i){
    swatch($('#g-bg'),function(){
      bgI=i;
      render()
    },76,50,function(g,w,h){
      drawBG(g,w,h,i)
    })
  })(i);

  // 左邊「色塊」面板的形狀與顏色
  var SH=[['circle','#ff3b3b'],['square','#2f6fff'],['triangle','#ffe600'],['star','#3dd45f'],['burst','#ff66dd'],['heart','#ff8a1c'],['circle','#a870c8'],['square','#00c2c2']];
  SH.forEach(function(a){
    swatch($('#g-sh'),function(){
      add({t:'s',k:a[0],c:a[1],sc:1.3})
    },60,60,function(g){
      g.translate(30,30);
      shape(g,a[0],a[1],22)
    })
  });
  ['.snail','.frog','.teeth','.tama','.cd','.cursor','.guy'].forEach(function(s){
    var el=document.querySelector(s);
    if(!el||!el.src)return;
    var b=document.createElement('button'),im=new Image();
    im.src=el.src;
    im.alt='';
    b.appendChild(im);
    b.onclick=function(){
      addImg(el,false)
    };
    $('#g-stk').appendChild(b)
  });

  // 文字與色塊可選的顏色
  var COLS=['#ff3b3b','#ffe600','#3dd45f','#2f6fff','#ff66dd','#ff8a1c','#ffffff','#111111'];
  ['#g-col','#g-col2'].forEach(function(id){
    COLS.forEach(function(c){
      var b=document.createElement('button');
      b.className='sw';
      b.style.background=c;
      b.setAttribute('aria-label',c);
      b.onclick=function(){
        color=c;
        if(sel&&(sel.t==='t'||sel.t==='s')){
          sel.c=c;
          render()
        }
      };
      $(id).appendChild(b)
    })
  });
  $('#addt').onclick=function(){
    var t=$('#tx').value.trim()||'新醜風',go=function(){
      add({t:'t',txt:t,c:color,sc:1});
    };
    if(document.fonts&&document.fonts.load)document.fonts.load(TF,t).then(go,go);
    else go()
  };
  $('#file').addEventListener('change',function(e){
    var f=e.target.files[0];
    if(!f)return;
    var r=new FileReader();
    r.onload=function(){
      var im=new Image();
      im.onload=function(){
        addImg(im,true);
        tab('face');
        msg('照片已加入，可以換風格、拖曳或縮放')
      };
      im.onerror=function(){
        msg('這個檔案無法開啟，請換一張 JPG 或 PNG')
      };
      im.src=r.result
    };
    r.readAsDataURL(f);
    e.target.value=''
  });

  // 下載圖片
  function save(b){
    var go=function(d){
      if(d){
        return d.save({filename:'new-ugly-remix.png',data:b}).then(function(){
          msg('已送出下載')
        },function(er){
          if(!er||er.code!=='declined')msg('下載失敗，請再試一次')
        })
      }
      var a=document.createElement('a');
      a.href=URL.createObjectURL(b);
      a.download='new-ugly-remix.png';
      document.body.appendChild(a);
      a.click();
      a.remove();
      msg('已下載')
    };
    if(window.claude&&claude.use){
      claude.use('downloads').then(go,function(){
        go(null)
      })
    } else go(null)
  }
  $('#dl').onclick=function(){
    out=true;
    render();
    cv.toBlob(function(b){
      out=false;
      render();
      if(b)save(b)
    },'image/png')
  };
  render();
}

/* ===== 啟動編輯器 ===== */
initEditor();
