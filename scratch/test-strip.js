function _calcSubjectViaSTT(data, separator) {
  let subjectIndex = -1;
  const numData = parseInt(String(data).replace(/[^0-9]/g, ''), 10);
  if (separator == 100) {
    subjectIndex = numData % separator;
  } else {
    subjectIndex = Math.floor(numData / separator);
  }
  return subjectIndex % separator;
}
console.log(_calcSubjectViaSTT('>12017', 1000));
