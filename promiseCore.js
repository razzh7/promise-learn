class myPromise {
  constructor(excutor) {
    this.PromiseState = 'pending'
    this.PromiseResult = undefined
    this.onFulfilledCallbacks = []
    this.onRejectedCallbacks = []

    const resolve = (value) => {
      if (value instanceof myPromise) {
        return value.then(resolve, reject)
      }
      setTimeout(() => {
        if (this.PromiseState === 'pending') {
          this.PromiseState = 'fulfilled'
          this.PromiseResult = value
          for (let i = 0; i < this.onFulfilledCallbacks.length; i++) {
            this.onFulfilledCallbacks[i](value)
          }
        }
      })
    }

    const reject = (reason) => {
      setTimeout(() => {
        if (this.PromiseState === 'pending') {
          this.PromiseState = 'reject'
          this.PromiseResult = reason
          for (let i = 0; i < this.onRejectedCallbacks.length; i++) {
            this.onRejectedCallbacks[i](reason)
          }
        }
      })
    }
    try {
      excutor(resolve, reject)
    } catch(error) {
      this.reject(error)
    }
  }

  then(onFulfilled, onRejected) {
    // 2.2.2 + 2.2.3
    onFulfilled = typeof onFulfilled === 'function' ? onFulfilled : value => value
    onRejected = typeof onRejected === 'function' ? onRejected : (reason) => { throw reason }
    // promise2是下一个then的实例化结果
    let promise2 = new myPromise((resolve, reject) => {
      if (this.PromiseState === 'fulfilled') {
        // 2.2.4
        setTimeout(() => {
          // 2.2.7.2
          try {
            // 2.2.7.1 x是上一层then回调执行的结果
            let x = onFulfilled(this.PromiseResult)
            // 链式调用，处理返回值
            resolvePromise(promise2, x, resolve, reject)
          } catch(e) {
            reject(e)
          }
        })
      }
      // 2.2.3
      if (this.PromiseState === 'reject') {
        // 2.2.4
        setTimeout(() => {
          // 2.2.7.2
          try {
            let x = onRejected(this.PromiseResult)
            resolvePromise(promise2, x, resolve, reject)
          } catch(e) {
            reject(e)
          }
        })
      }
  
      if (this.PromiseState === 'pending') {
        this.onFulfilledCallbacks.push(() => {
          try {
            let x = onFulfilled(this.PromiseResult)
            resolvePromise(promise2, x, resolve, reject)
          } catch (e) {
            reject(e)
          }
        })

        this.onRejectedCallbacks.push(() => {
          // 2.2.7.2
          try {
            let x = onRejected(this.PromiseResult)
            resolvePromise(promise2, x, resolve, reject)
          } catch(e) {
            reject(e)
          }
        })

      }
    })
    return promise2
  }

  catch(reason) {
    return this.then(null, reason)
  }
  
}

function resolvePromise(promise2, x, resolve, reject) {
  let then
  let called = false
  // 2.3.1 x不能是promise2的实例化对象
  if (x === promise2) {
    reject(new TypeError('Chaining cycle detected for myPromise'))
  }
  // 2.3.2
  if (x instanceof myPromise) {
    x.then(y => {
      // 2.3.2.1
      resolvePromise(promise2, y, resolve, reject)
    }, reject)
  } else if (x !== null && (typeof x === 'object' || (typeof x === 'function'))) {
    // 2.3.3.2
    try {
      then = x.then
    } catch(e) {
      reject(e)
    }
    // 2.3.3
    if (typeof then === 'function') {
      // 2.3.3.3.4
      try {
        then.call(
          x,
          (y) => {
            // 2.3.3.3.3
            if (called) return
            called = true
            // 2.3.3.3.1
            resolvePromise(promise2, y, resolve, reject)
          },
          (r) => {
            // 2.3.3.3.3
            if (called) return
            called = true
            // 2.3.3.3.2
            reject(r)
          }
        )
      } catch (e) {
        // 2.3.3.3.4.1
        if (called) return
        called = true
        // 2.3.3.3.4.2
        reject(e)
      }
    } else {
      // 2.3.3.4
      resolve(x)
    }
  } else {
    // 2.3.3.4
    resolve(x)
  }
}

myPromise.deferred = function () {
    let result = {};
    result.promise = new myPromise((resolve, reject) => {
        result.resolve = resolve;
        result.reject = reject;
    });
    return result;
}

module.exports = myPromise;