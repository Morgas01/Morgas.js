(function(µ,SMOD,GMOD){
	/**
	 * Defines a Controller with buttons and axes
	 */
	var SC=µ.shortcut({
		rescope:"rescope"
	});
	
	var LST=GMOD("Listeners");
	
	
	var CTRL=µ.Controller=µ.Class(LST);
	
	CTRL.Axis=µ.Class({
		init:function(x,y)
		{
			this.x=x||0;
			this.y=y||0;
		},
		set:function(x,y)
		{
			this.x=x;
			this.y=y;
			return this;
		},
		equals:function(x,y)
		{
			if(this.x==x&&this.y==y||(typeof x==="object"&&this.x==x.x&&this.y==x.y))
			{
				return true;
			}
			return false;
		},
		getForce:function()
		{
			return Math.sqrt(this.x*this.x+this.y*this.y);
		},
		getAngle:function()
		{
			if(this.y!==0||this.x!==0)
			{
				var a=Math.asin(this.y/this.getForce());
				if(this.x>=0)
				{
					a=Math.PI/2-a;
				}
				else
				{
					a+=Math.PI*1.5;
				}
				return a;
			}
			return 0;
		},
		getDirection4:function()
		{//0:none 1:up 2:right 3:down 4:left
			if(this.y===0&&this.x===0)
			{
				return 0;
			}
			else if(Math.abs(this.y)>Math.abs(this.x))
			{
				if(this.y>0)
				{
					return 1;
				}
				else
				{
					return 3;
				}
			}
			else
			{
				if(this.x>0)
				{
					return 2;
				}
				else
				{
					return 4;
				}
			}
		},
		getDirection8:function()
		{
			//0:none 1:up 2:up-left 3:left 4:down-left ...
			if(this.y===0&&this.x===0)
			{
				return 0;
			}
			else
			{
				return 1+Math.round(this.getAngle()/(Math.PI/4));
			}
		},
		toString:function()
		{
			JSON.stringify(this);
		},
		toJSON:function()
		{
			return {direction:this.getDirection8(),x:this.x,y:this.y,angle:this.getAngle().toPrecision(4)};
		}
		
	});
	
	CTRL.prototype.init=function(buttonCount,axesCount)
	{
		this.superInit(LST);
		
		this.axes=[];
		this.buttons=[];
		
		if(!buttonCount)
		{
			buttonCount=10;
		}
		for(var i=0;i<buttonCount;i++)
		{
			this.buttons.push(0);
		}
		
		if(!axesCount)
		{
			axesCount=2;
		}
		for(var i=0;i<axesCount;i++)
		{
			this.axes.push(new CTRL.Axis());
		}
		
		this.createListener("changed axisChanged buttonChanged");
	};
	CTRL.prototype.toString=function()
	{
		return JSON.stringify(this);
	};
	CTRL.prototype.toJSON=function()
	{
		return {buttons:this.buttons,axes:this.axes};
	};
	CTRL.prototype.setButton=function(index,value)
	{
		if(this.buttons[index]!==value)
		{
			this.buttons[index]=value;
			this.fire("buttonChanged",index,value);
			this.fire("changed");
		}
	};
	CTRL.prototype.setAxis=function(index,x,y)
	{
		if(x===null)
		{
			x=this.axes[index].x;
		}
		if(y===null)
		{
			y=this.axes[index].y;
		}
		if(!this.axes[index].equals(x,y))
		{
			this.axes[index].set(x,y)
			this.fire("axisChanged",index,this.axes[index]);
			this.fire("changed");
		}
	};
	
	SMOD("Controller",CTRL);
	
})(Morgas,Morgas.setModule,Morgas.getModule);