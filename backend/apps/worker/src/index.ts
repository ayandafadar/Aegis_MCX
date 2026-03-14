import { correlate } from "@aegis/correlation";

setInterval(() => {
  correlate();
}, 5000);
