/*
 * Los IDs de los tuits se deben manejar como [strings] en lugar de [int]
 * porque los valores son más altos que el valor numérico que acepta JavaScript
 *
 * Incrementa en 1 un string numérico
 */
exports.stringInc = function (v){
    var digits = v.toString().split('');
    var i = digits.length-1;
    while (digits[i]==9 && i>0){      
      digits[i] = 0;
      i--;
    }
    digits[i] = 1+parseInt(digits[i]);
    return digits.join('');
}

/*
 * Decrementa en 1 un string numérico
 */
exports.stringDec = function  (n) {
    n = n.toString();
    var result=n;
    var i=n.length-1;
    while (i>-1) {
      if (n[i]==="0") {
        result=result.substring(0,i)+"9"+result.substring(i+1);
        i --;
      }
      else {
        result=result.substring(0,i)+(parseInt(n[i],10)-1).toString()+result.substring(i+1);
        return result;
      }
    }
    return result;
}