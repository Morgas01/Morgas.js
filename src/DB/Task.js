(function(µ,SMOD,GMOD,HMOD,SC){

	let DBObj=GMOD("DBObj"),
		FIELD=GMOD("DBField");

	SC=SC({
		dateConvert:"converter/date"
	});

	let Task=µ.Class(DBObj,{
		objectType:"Task",
		constructor:function({
			ID,
			name,
			state=Task.states.PENDING,
			messages=[],
			creationDate=new Date(),
			progress=0,
			progressDate=creationDate,
			progressMax=100,
			//modifiedDate=creationDate,
			startDate=creationDate,
            startProgress=progress
		}={})
		{

			this.mega({ID});

			this.addField("name",			FIELD.TYPES.STRING	,name);
			this.addField("state",			FIELD.TYPES.STRING	,state);
			this.addField("messages",		FIELD.TYPES.JSON	,messages);
			this.addField("progress",		FIELD.TYPES.INT		,progress);
			this.addField("progressDate",	FIELD.TYPES.DATE	,progressDate);
			this.addField("progressMax",	FIELD.TYPES.INT		,progressMax);
			//this.addField("modifiedDate",	FIELD.TYPES.DATE	,modifiedDate);
			this.addField("creationDate",	FIELD.TYPES.DATE	,creationDate);

			// progressing fields
			this.addField("startDate",			FIELD.TYPES.DATE	,startDate);
			this.addField("startProgress",		FIELD.TYPES.INT		,startProgress);
			this.addField("lastProgressDate",	FIELD.TYPES.DATE);
			this.addField("lastProgress",		FIELD.TYPES.INT);
		},
		addMessage(message)
		{
			this.messages.push({message,time:SC.dateConvert.to(new Date())});
		},
		setState(state)
		{
			if(state===Task.states.RUNNING)
			{
				this.startDate=new Date();
				this.startProgress=this.progress;
				this.setProgress(this.progress)
			}
			this.state=state;
		},
		setProgress(value)
		{
			this.lastProgress=this.progress;
			this.lastProgressDate=this.progressDate;

			this.progress=value;
			this.progressDate=new Date();
		},
		modified()
		{
			this.modifiedDate=new Date();
		},
		getRemainingTime()
		{
			return 	(this.progress - this.startProgress)/(this.progressDate - this.startDate);
		},
		getCurrentRemainingTime()
		{
			return 	(this.progress - this.lastProgress)/(this.progressDate - this.lastProgressDate);
		}
	});

	Task.states={
		DISABLED:"disabled",
		PENDING:"pending",
		RUNNING:"running",
		PAUSED:"paused",
		DONE:"done",
		FAILED:"failed"
	};

	SMOD("Task",Task);

})(Morgas,Morgas.setModule,Morgas.getModule,Morgas.hasModule,Morgas.shortcut);