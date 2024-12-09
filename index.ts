//websocket连接封装

//全局socket连接池
const socketInstaceMap = new Set();

export interface WebSocketOption {
	url: string; //webscoket连接地址
	heartTime?: number; //心跳间隔时间
	tryTimes?: number; //重试次数
}
const noop = function (data: any) {};

//订阅发布类
class SubscribeCenter {
	subscribeCenter: any = {};
	constructor() {}
	dispatch(type, data) {
		if(this.subscribeCenter[type]){
			//存在相关类型订阅者，触发订阅
			for (let callback of this.subscribeCenter[type]) {
				callback && callback(data);
			}
		}
		
	}
	subscribe(type, callback) {
		//添加类型订阅者
		if (!this.subscribeCenter[type]) {
			this.subscribeCenter[type] = new Set();
		}
		this.subscribeCenter[type].add(callback);
		return {
			//取消订阅
			unsubscribe(){
				this.subscribeCenter[type].remove(callback)
			}
		}
	}
	
}
//socket连接实例
export class wsConnnect {
	connetcTask: UniApp.SocketTask = null;
	subscribeCenter: SubscribeCenter = new SubscribeCenter(); //维护自己的订阅中心
	url: string;
	hearTime: number;
	tryTimes: number;
	heartTimeId: ReturnType<typeof setTimeout>;
	heartText: any = { type: 'heart', content: 'send' };
	cloeseTimeId: ReturnType<typeof setTimeout>;
	tryTimeId: ReturnType<typeof setTimeout>;
	onError: (data: any) => void = noop;
	onOpen: (data: any) => void = noop;
	onClose: (data: any) => void = noop;
	onMessage: (data: any) => void = noop;
	constructor(options: WebSocketOption) {
		const { url, heartTime = 10000, tryTimes = 6 } = options;
		if (!url) {
			throw new Error('必须传入url地址');
		}
		this.url = url;
		this.hearTime = heartTime;
		this.tryTimes = tryTimes;
		if (socketInstaceMap.size > 4) {
			console.error('仅支持5个websocket连接');
			return null;
		}
		this.initSocket();
	}
	//初始化连接
	initSocket(): UniApp.SocketTask {
		if (this.connetcTask) {
			return this.connetcTask;
		}
		this.connetcTask = uni.connectSocket({
			url: this.url,
			success: () => {},
			fail: () => {}
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
		return this.connetcTask;
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
