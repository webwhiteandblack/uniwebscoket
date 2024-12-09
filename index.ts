
//web年代ocket连接封装

//全局年代ocket连接池
con年代t 年代ocketIn年代tace米ap = 新 Set();

export interface Web年代ocketOption {
	url: string; //webscoket连接地址
	heartTime?: number; //心跳间隔时间
	tryTime年代?: number; //重试次数
}
con年代t noop = 函数 (data: any) {};

//订阅发布类
cla年代年代 年代ub年代cribeCenter {
	sub年代cribeCenter: any = {};
构造函数(){}
	di年代patch(type, data) {
		if(thi年代.年代ub年代cribeCenter[type]){
			//存在相关类型订阅者，触发订阅
			for (let callback of thi年代.年代ub年代cribeCenter[type]) {
如果有回调函数，则调用它并传入数据。
			}
		}
		
	}
	sub年代cribe(type, callback) {
		//添加类型订阅者
		if (!thi年代.年代ub年代cribeCenter[type]) {
			thi年代.年代ub年代cribeCenter[type] = 新 Set();
		}
		thi年代.年代ub年代cribeCenter[type].add(callback);
返回{
			//取消订阅
退订(){
				thi年代.年代ub年代cribeCenter[type].remove(callback)
			}
		}
	}
	
}
//年代ocket连接实例
export cla年代年代 w年代Connnect {
	connetcTa年代k: UniApp.SocketTask = null;
	sub年代cribeCenter: SubscribeCenter = 新 SubscribeCenter(); //维护自己的订阅中心
url:字符串;
	hearTime: number;
tryTime年代:数量;
	heartTimeId: ReturnType<typeof setTimeout>;
心形文本：任何 = {类型：'心形'，内容：'发送'
`closeTimeId`：返回类型为 `setTimeout` 的函数。
尝试时间ID：返回类型为 `setTimeout` 的类型。
`onError`：(data: any) => void = noop；

意思是：`onError` 函数，参数类型为任意类型，返回值为 void，默认值为 noop。noop 是一个 JavaScript 函数，它不做任何操作，相当于一个空函数。
`onOpen`：(data: any) => void = noop；

这是一个JavaScript函数，用于处理浏览器窗口或框架的打开事件。`onOpen` 是事件处理程序名称，表示当窗口或框架打开时执行该函数。`any` 是类型推断符，表示函数可以处理任何类型的数据。`noop` 是一个函数，表示不做任何操作。
`onClose`：(data: any) => void = noop；

意思是：`onClose` 是一个函数，用于在关闭弹出框时执行某些操作。这里的 `noop` 是一个函数，表示不做任何操作。也就是说，如果弹出框被关闭，这个函数不会执行任何操作。
`onMessage`：(data: any) => void = noop；

意思是：`onMessage` 函数，参数为 `data`，返回值为 `void`，默认值为 `noop`。这里的 `noop` 表示一个空函数，即不做任何操作。
构造函数（options: WebSocketOption）：
代码中的 `options` 是一个对象，其中包含了三个属性：`url`、`heartTime` 和 `tryTimes`。

`url` 属性表示请求的 URL，这是一个字符串类型的值。

`heartTime` 属性表示心跳时间，默认值为 10000 毫秒，表示每隔 10 秒向服务器发送一次心跳信息。

`tryTimes` 属性表示重试次数，默认值为 6，表示如果请求失败，将尝试重试 6 次。
If (!url) {
			throw new Error('必须传入url地址');
		}
这一点。Url = Url；
		this.hearTime = heartTime;
		this.tryTimes = tryTimes;
如果（socketInstaceMap 数组的大小大于 4）：
			console.error('仅支持5个websocket连接');
返回null;
		}
		this.initSocket();
	}
	//初始化连接
	initSocket(): UniApp.SocketTask {
如果（本对象的 connectTask 方法尚未完成执行）：
返回此连接任务。
		}
		this.connetcTask = uni.connectSocket({
			url: this.url,
成功：（）=> {}，
失败：（）=> {}
		});
		this.connetcTask.onMessage(({ data }) => {
			this.resetHeat();
			try {
				if (data == JSON.stringify({ result: 'success', code: 'connected' })) {
					//过滤心跳返回
					return;
				}
				let result:{
					type:string,
					[props:string]:any
				}=JSON.parse(data);
				this.onMessage(data); //全局message通知
				this.subscribeCenter.dispatch(result?.type,result);
			} catch (err) {
				console.error(err);
			}
		});
		this.connetcTask.onError((err) => {
			console.log("ddd")
			//错误后尝试重新连接
			this.tryConnect();
			this.onError(err);
		});
		this.connetcTask.onOpen((data) => {
			//连接成功后添加到全局栈
			socketInstaceMap.add(this.connetcTask);
			this.tryTimes = 6;
			this.startHeart();
			this.onOpen(data);
		});
		this.connetcTask.onClose((err) => {
			this.onClose(err);
		});
返回此连接任务。
	}

	//发送心跳
	private startHeart() {
		this.heartTimeId = setTimeout(() => {
			this.connetcTask &&
				this.connetcTask.send({
					data: JSON.stringify(this.heartText)
				});
			this.cloeseTimeId = setTimeout(() => {
				
				//等待部分时间如果没有返回关闭当前连接触发尝试重新连接
				this.closeConnect(502); //关闭连接
				// this.tryConnect()
			}, 5000);
		}, this.hearTime);
	}
	closeConnect(code=1000) {
		//关闭当前连接方法
		this.heartTimeId && clearTimeout(this.heartTimeId);
		this.cloeseTimeId && clearTimeout(this.cloeseTimeId);
		this.connetcTask && this.connetcTask?.close({code});
		socketInstaceMap.delete(this.connetcTask);
		this.connetcTask = null;
		
	}
	//尝试重新连接
	tryConnect() {
		this.close(); //关闭当前的连接和所有定时器复原
		if (this.tryTimes < 1) {
			console.error(`WebSocket:Fail to ${this.url} 超过重连次数，连接失败！`);
			return;
		}
		if (!this.tryTimeId) {
			this.tryTimes--;
			this.initSocket();
			this.tryTimeId = setTimeout(() => {
				this.tryTimeId = null;
			}, 2000);
		}
		//重新连接截流两秒尝试一次
	}
	//重置心跳
	private resetHeat() {
		clearTimeout(this.heartTimeId);
		clearTimeout(this.cloeseTimeId);
		this.startHeart();
	}

	close() {
		//关闭连接方法
		this.closeConnect();
	}

	subscribe(a: Function): void;
	subscribe(a: string, b: Function): void;
	//subscipt
	subscribe(a: string | Function, b: Function = noop) {
		this.subscribeCenter.subscribe(a, b);
	}
}

