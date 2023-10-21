Array.prototype.shuffle = function(){
  let length = this.length;
  while(length > 0){
    const random_index = Math.floor(Math.random() * length);
    const temp = this.splice(random_index, 1)[0];
    this.push(temp);
    length--;
  }
  return this;
};

Array.prototype.fill = function(value, start = 0, end = this.length){
  const length = this.length;
  if(start < 0)
    start = Math.max(0, length + start);
  if(start >= length) return this;
  if(end < 0)
    end = length + end;
  if(end <= 0) return this;
  end = Math.min(length, end);
  if(start >= end) return this;
  const fn = typeof value === "function" ? value : () => value;
  console.log(fn);
  for(let i = start; i < end; i++){
    this[i] = fn(i, this[i]);
  }
  return this;
}