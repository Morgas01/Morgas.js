(function(µ,SMOD,GMOD){

	var SC=µ.shortcut({
		rescope:"rescope"
	});

	var CTRL=GMOD("Controller");
	
	var GP=CTRL.Gamepad=µ.Class(CTRL,{
		init:function(gamepad,map,pollDelay)
		{
			this.gamepad=gamepad;
			
			this.superInit(CTRL,this.gamepad.buttons.length,this.gamepad.axes.length>>>1);
			
			SC.rescope.all(["update"],this)
			
			this.pollDelay=pollDelay||GP.pollDelay;

			this.map=map||{};
			this.map.buttons=this.map.buttons||{};
			this.map.axes=this.map.axes||{};
			
			this.addListener(".created",this.update);
		},
		update:function()
		{
			var sortedAxes=[];
			for(var i=0,l=this.gamepad.axes.length;i<l;i++)
			{
				var index=this.map.axes[i]||i;
				this.map.axes[i]=index;
				sortedAxes[Math.abs(index)]=(this.gamepad.axes[i]*Math.sign(1/index));
			}
			for(var i=0,l=sortedAxes.length;i<l;i+=2)
			{
				this.setAxis(i>>>1,sortedAxes[i],sortedAxes[i+1]);
			}
			for(var i=0,l=this.gamepad.buttons.length;i<l;i++)
			{
				var index=this.map.buttons[i]||i;
				this.map.buttons[i]=index;
				this.setButton(index,this.gamepad.buttons[i].value);
			}
			setTimeout(this.update,this.pollDelay);
		},
		toJSON:function()
		{
			var json=CTRL.prototype.toJSON.call(this);
			json.gpIndex=this.gpIndex;
			return json;
		}
	});
	GP.pollDelay=100;
})(Morgas,Morgas.setModule,Morgas.getModule);