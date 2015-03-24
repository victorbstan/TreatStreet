TreatStreet.filter("nl2br", function($filter) {
  return function(data) {
    if (!data) return data;
    return data.replace(/\n\r?/g, '<br />');
  };
});

TreatStreet.filter("nl2Array", function($filter) {
  return function(data) {
    if (!data) return data;
    return data.split('\n');
  };
});
