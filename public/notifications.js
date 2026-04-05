const btn=document.getElementById("subscribeBtn")

btn.addEventListener("click",async()=>{

const permission=await Notification.requestPermission()

if(permission!=="granted"){

alert("Allow notifications in browser settings")

return

}

const configRes=await fetch("/firebase-config")
const config=await configRes.json()

firebase.initializeApp(config)

const messaging=firebase.messaging()

const token=await messaging.getToken({vapidKey:config.vapidKey})

await fetch("/subscribe",{

method:"POST",
headers:{"Content-Type":"application/json"},
body:JSON.stringify({token})

})

alert("Subscribed successfully")

})