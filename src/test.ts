interface NumberDictionary {
    [index: string]: number | string | undefined;
    length: number;    // 可以，length是number类型
    name?: string;       // 错误，`name`的类型与索引类型返回值的类型不匹配
  }

let myArray: NumberDictionary = {
    "length" : 1,
    "name2" : 2,
};

// let myStr: string = myArray[0];

console.log(myArray);