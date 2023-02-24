export default async (req, res) => {
	if (!req.body.identifier) {
		return res.status(400).json({
			success: false,
			message: "No identifier defined."
		});
	}
	
	// Get the Config
	const config = await import(`../../../_db/${process.env.NEXT_PUBLIC_SITE_KEY}/config.json`)  
	let sessions = config.sessions;
	
	// Get the current state for the user...
	const existingRes = await fetch(`http://localhost:3000/api/notifications/subscriptions?identifier=${req.body.identifier}`);
	const existingResult = await existingRes.json()
	const existingSubscriptions = existingResult.subscriptions
	
	
	var subscriptions = {};
	for await (const session of sessions) {
		if(req.body.topics.includes(session) && (!existingSubscriptions[session] || existingSubscriptions[session] != true)){
			
			console.log("Add "+session)
			
			// Subscribe...
			const response = await fetch(`https://api.novu.co/v1/topics/${session}/subscribers`, {
			  method: 'POST',
			  headers: {
				'Content-Type': 'application/json',
				'Authorization': `ApiKey ${process.env.NEXT_PUBLIC_NOVU_API}`,
			  },
			  body: JSON.stringify({
				subscribers: [req.body.identifier]
			  }),
			});
			const data = await response.json();
		} else if((existingSubscriptions[session] && existingSubscriptions[session] == true) && !req.body.topics.includes(session)) {
			
			console.log("Remove "+session)
			
			// Unsubscribe...
			try {
				const response2 = await fetch(`https://api.novu.co/v1/topics/${session}/subscribers/removal`, {
			  		method: 'POST',
			  		headers: {
						'Content-Type': 'application/json',
						'Authorization': `ApiKey ${process.env.NEXT_PUBLIC_NOVU_API}`,
			  		},
			  		body: JSON.stringify({
						subscribers: [req.body.identifier]
			  		}),
				});
			} catch(error) {
				console.log(error);
			}
		}
	}
	
	return res.json({success:true});
}