import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs/promises';

test('mobile notification path uses the service worker, requests permission only explicitly', async () => {
  let permissionCalls=0, constructorCalls=0;
  const shown=[];
  const savedWindow=globalThis.window;
  const savedNavigator=Object.getOwnPropertyDescriptor(globalThis,'navigator');
  const savedNotification=globalThis.Notification;
  class FakeNotification {
    static permission='default';
    static async requestPermission(){permissionCalls++;this.permission='granted';return 'granted';}
    constructor(){constructorCalls++;throw new Error('Mobile constructor is unavailable');}
  }
  const registration={showNotification:async(title,options)=>shown.push({title,options})};
  globalThis.window={Notification:FakeNotification};
  globalThis.Notification=FakeNotification;
  Object.defineProperty(globalThis,'navigator',{configurable:true,value:{serviceWorker:{register:async path=>{assert.equal(path,'/notification-sw.js');},ready:Promise.resolve(registration)}}});
  try{
    const {requestNotificationPermission,showReminderNotification}=await import('../src/lib/notifications.js');
    const record={id:'test-reminder',text:'去公园散步'};
    assert.equal(await showReminderNotification(record),false);assert.equal(permissionCalls,0);
    assert.equal(await requestNotificationPermission(),'granted');assert.equal(permissionCalls,1);
    assert.equal(await showReminderNotification(record,()=>false),false);assert.equal(shown.length,0,'cancelled or rescheduled reminder does not notify');
    assert.equal(await showReminderNotification(record),true);
    assert.equal(shown.length,1);assert.equal(shown[0].options.body,record.text);assert.equal(shown[0].options.data.recordId,record.id);assert.equal(constructorCalls,0);
    registration.showNotification=async()=>{throw new Error('Notifications blocked');};
    assert.equal(await showReminderNotification(record),false);
  }finally{
    globalThis.window=savedWindow;globalThis.Notification=savedNotification;
    if(savedNavigator)Object.defineProperty(globalThis,'navigator',savedNavigator);else delete globalThis.navigator;
  }
});

test('a notification click opens its reminder in an existing page or the reminder list', async () => {
  const handlers={},events=[];let windows=[];
  const self={location:{origin:'https://app.example'},skipWaiting(){},addEventListener:(event,cb)=>{handlers[event]=cb;},clients:{claim(){},matchAll:async()=>windows,openWindow:async url=>events.push(url)}};
  vm.runInNewContext(await fs.readFile(new URL('../public/notification-sw.js',import.meta.url),'utf8'),{self,URL});
  let pending;
  const event={notification:{close(){},data:{recordId:'r1'}},waitUntil(p){pending=p;}};
  handlers.notificationclick(event);await pending;assert.equal(events[0],'/?reminders=1');
  windows=[{url:'https://app.example/',focus:async()=>events.push('focused'),postMessage:message=>events.push(message)}];
  handlers.notificationclick(event);await pending;
  assert.equal(events[1],'focused');assert.equal(events[2].recordId,'r1');assert.equal(events[2].type,'OPEN_REMINDER');
});
