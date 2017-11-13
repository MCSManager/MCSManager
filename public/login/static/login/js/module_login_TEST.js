;(function(win){
    var _list = {};
    var _isNotDefined =0;
    
    function loadModule(name,callback){
        tmp = _list[name];
        //console.log(('载入函数模块开始 tmp:'+tmp+" name:"+name)
        if(typeof _list[name] == 'undefined'){
            setTimeout(function(){
            	console.log('进入异步：'+name)
                var i=0;
                while(typeof _list[name] === 'undefined' && i <200){
                	//console.log("自旋: "+i)
                    i++; //自旋
                }
                //console.log("自旋结束 ")
                callback(name)
            },0);
        }else{
        	console.log("没有进行自旋直接运行了： "+name)
        	callback(name)
        }
    };
    
    
    function loadList(listName){
    	tmp =[];
    	for(v in listName){
    		tmp.push(_list[listName.pop()]);
    	}
    	return tmp;
    }
    
    var sw = win.sw = {
        module : function(needs,callback,returnback){
            var z = needs.length;
            var i = 0;
            var mkback = []
            //console.log(('module函数 我需要这些模块 : ' + needs +"")
            while(i<needs.length){
                //console.log(("I:"+i)
                //console.log((_list[needs[i]])
                if(typeof needs[i] === 'string'){
                	var e = i;
                    loadModule(needs[i],function(listname){
                        //console.log('loadModule 函数成功载入了！压入： '+obj);
                        z--;
                        mkback.push(listname);
                        if(z <= 0){
                            //console.log(('Z==0了 并且开始执行 returnback（不一定）loadModule成功 ')
                            if(returnback){
                            	mkback2 = loadList(mkback);
                            	console.log('程序执行！returnback  _isNotDefined值：'+_isNotDefined +"是谁： "+listname)
                                var tmp = callback.apply(undefined,mkback2)
                                returnback.call(undefined,tmp)
                                _isNotDefined--;
                            }else{
                            	//while(_isNotDefined > 0)continue;
                                setTimeout(function(){
                                	console.log("233")
                                	if(_isNotDefined <= 0){
                                		mkback2 = loadList(mkback);
                            			callback.apply(undefined,mkback2)
                            		}
                                	setTimeout(arguments.callee,2000);
                                },2000);
                            }
                        }
                    });
                    i++;
                }else{
                    z--;
                    mkback.push(_list[needs[i]]);
                    i++;
                    //console.log((mkback)
                    if(z <= 0){
                        if(returnback){
                            returnback.apply(undefined,callback.apply(undefined,mkback))
                            _isNotDefined--;
                        }else{
                        	//while(_isNotDefined > 0)continue;
                        	callback.apply(undefined,mkback)
                        }
                    }
                }
            }
        },
        
        defineModule : function(needs,str,fn){
        	console.log("定义模块 "+str+" 依赖模块:"+needs)
            var li;
            li = str.split('.');
            var old;
            var ele;
            old=_list;
            ele=_list;
            for(var i=0;i<li.length;i++){
            	console.log('74 define['+li[i]+']进入的是 '+ele[li[i]])
                if(typeof ele[li[i]] === 'undefined'){
                	console.log('我们将会把'+li.slice(0,i+1).join('.')+"给定义为{}")
                    _list[li.slice(0,i+1).join('.')] = ele[li[i]] = {};
                }
                old = ele;
                ele = ele[li[i]];
            }
            console.log('我们将定义有的模块 '+li[i-1])
            if(needs.length > 0){
            	_isNotDefined++;
                sw.module(needs,fn,function(ret){
                    console.log('sw.module _list[str] is: ' + ret)
                    console.log("赋值给：str："+str+" | "+li[i-1])
                    _list[str] = old[li[--i]] = ret;
                    sw.test()
                });
            }else{
                tmp = fn.call(undefined);
                console.log('Push _list[str] is:'+tmp)
                _list[str] = old[li[--i]] = tmp
                sw.test()
            }
        },
        
        Name:'Suwings',
        test:function(){
            console.log(_list)
        },
        testName:function(Name){
            console.log('字典'+Name+"的值是:" + _list[Name])
        }
        
    };
    
    
})(window);

$(function(){
    //console.log(('SW:'+window.sw)
    sw.defineModule(['suwings.login'],'suwings.test',function(sw){
    	console.log('成功载入 suwings.test')
        return function(){
            console.log('suwings.test!!!!CALL 模块成功！！！')
            sw()
        }
    });

    sw.defineModule([],'suwings.login',function(){
    	console.log('成功载入suwings.login')
        return function(){
            console.log('suwings.login!!!!CALL 模块成功调用！！');
        }
    });
    
    sw.module(['suwings.login','suwings.test'],function(test,e){
    	
        console.log('开始运行========= suwings.test模式 ['+test+"]  ["+e)
        console.log('输出：')
        sw.test();
        test();
        e();
    })
    sw.test();
});
