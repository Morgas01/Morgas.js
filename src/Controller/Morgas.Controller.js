(function(µ,SMOD,GMOD){
	/**
	 * Defines a Controller with 10 buttons and 2 axes
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
			return {direction:this.getDirection8(),x:this.x,y:this.y,angle:this.getAngle()};
		}
		
	});
	
	CTRL.prototype.init=function()
	{
		this.superInit(LST);
		
		this.axes=[new CTRL.Axis(),new CTRL.Axis()];
		this.buttons=[0,0,0,0,0,0,0,0,0,0];
		
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
	
	
	CTRL.Keyboard=µ.Class(CTRL,{
		init:function(domElement,map)
		{
			this.superInit(CTRL);
			
			SC.rescope.all(["onKeyDown","onKeyUp"],this)
			
			if(!domElement)
			{
				domElement=window
			}
			this.domElement=domElement;
			domElement.addEventListener("keydown", this.onKeyDown, false);
			domElement.addEventListener("keyup", this.onKeyUp, false);
			
			this.map=map||CTRL.Keyboard.stdMap;
			
		},
		set:function(code,value)
		{
			if(code in this.map.buttons)
			{
				this.setButton(this.map.buttons[code],value)
			}
			else
			{
				for(var i=0;i<this.map.axes.length;i++)
				{
					if(code in this.map.axes[i])
					{
						var x=null,y=null;
						switch(this.map.axes[i][code])
						{
							case 1:
								y=value;
								break;
							case 2:
								x=value;
								break;
							case 3:
								y=-value;
								break;
							case 4:
								x=-value;
								break;
							
						}
						this.setAxis(i,x,y);
						return;
					}
				}
			}
		},
		onKeyDown:function(event)
		{
			this.set(event.keyCode,1)
		},
		onKeyUp:function(event)
		{
			this.set(event.keyCode,0)
		},
		destroy:function()
		{
			this.domElement.removeEventListener("keydown", this.onKeyDown, false);
			this.domElement.removeEventListener("keyup", this.onKeyUp, false);
		}
	});
	CTRL.Keyboard.stdMap={
		buttons:{
			32:0,//space
			16:1,//shift
			97:2,//num 1
			98:3,//num 2
			99:4,//num 3
			100:5,//num 4
			101:6,//num 5
			102:7,//num 6
			19:8,//pause
			13:9,//enter
		},
		axes:[{
			87:1,//w
			68:2,//d
			83:3,//s
			65:4//a
		},{
			38:1,//up
			39:2,//right
			40:3,//down
			37:4,//left
		}]
	}

	SMOD("Controller",CTRL);
})(Morgas,Morgas.setModule,Morgas.getModule);