$(function()
{
  fetch("https://api.covid19india.org/states_daily.json")
    .then(data => data.json())
    .then(data => run(new Date("08-Apr-20"), data));
});

