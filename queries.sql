
SELECT DISTINCT A1.airportCode AS orig, A2.airportCode AS dest
FROM route R, airport A1, airport A2
WHERE R.orig=A1.airportId AND R.dest=A2.airportId;

SELECT A1.airportCode AS orig, A2.airportCode AS dest
FROM (
SELECT F.routeId, COUNT(*) AS total
FROM flight F
GROUP BY F.routeId
ORDER BY total DESC
LIMIT 20
) B,
route R,
airport A1,
airport A2
WHERE A1.airportId = R.orig AND A2.airportId = R.dest AND B.routeId = R.routeId;




/* Get time and distance */
SELECT R.airTime, R.distance
FROM route R, airport A1, airport A2
WHERE A1.airportId = R.orig AND A2.airportId = R.dest AND A1.airportCode = 'JFK' and A2.airportCode = 'SFO';

/* Create view */
CREATE OR REPLACE VIEW tempview AS
SELECT F.*
FROM route R, airport A1, airport A2, flight F
WHERE (
	R.orig = A1.airportId AND
	R.dest = A2.airportId AND
	A1.airportCode = 'LGA' AND
	A2.airportCode = 'ORD' AND
	F.routeId = R.routeId
);

/* Get table */
SELECT Air.description, A.tot, IFNULL(B.del,0) AS del, IFNULL(C.can,0) AS can, IFNULL(ROUND(B.del*100/A.tot,1),0) AS del_p, IFNULL(ROUND(C.can*100/A.tot,1),0) AS can_p, IFNULL(D.avg,0) AS avg
FROM
	(SELECT Q.airlineId, count(*) AS tot FROM tempview Q GROUP BY Q.airlineId) A LEFT OUTER JOIN
	(SELECT Q.airlineId, count(*) AS del FROM tempview Q WHERE EXISTS (SELECT * FROM flight_delayed FD WHERE FD.flightId=Q.flightId) GROUP BY Q.airlineId) B ON A.airlineId = B.airlineId LEFT OUTER JOIN
	(SELECT Q.airlineId, count(*) AS can FROM tempview Q WHERE EXISTS (SELECT * FROM flight_canceled FC WHERE FC.flightId=Q.flightId) GROUP BY Q.airlineId) C ON A.airlineId = C.airlineId LEFT OUTER JOIN
	(SELECT Q.airlineId, ROUND(AVG(FD.duration)) AS avg FROM tempview Q, flight_delayed FD WHERE Q.flightId=FD.flightId GROUP BY Q.airlineId) D ON A.airlineId = D.airlineId LEFT OUTER JOIN
	airline Air ON A.airlineId = Air.airlineId
ORDER BY A.tot DESC;

/* Get pie chart */
SELECT C.type, SUM(A.total) AS total
FROM (
SELECT IFNULL(FD.delayId, "0") AS delayId, IFNULL(FC.cancelId, "0") AS cancelId, COUNT(*) AS total
FROM tempview Q LEFT OUTER JOIN flight_delayed FD ON Q.flightId = FD.flightId
LEFT OUTER JOIN flight_canceled FC ON Q.flightId = FC.flightId
GROUP BY FD.delayId, FC.cancelId
) A LEFT JOIN delaycancel C ON A.cancelId = C.cancelId AND A.delayId = C.delayId
GROUP BY C.type
ORDER BY total DESC;

/* Get delays over time */
SELECT A.flightDate, C.type, SUM(A.total) AS total
FROM (
SELECT EXTRACT(YEAR_MONTH FROM Q.flightDate) AS flightDate, IFNULL(FD.delayId, "0") AS delayId, IFNULL(FC.cancelId, "0") AS cancelId, COUNT(*) AS total
FROM tempview Q LEFT OUTER JOIN flight_delayed FD ON Q.flightId = FD.flightId
LEFT OUTER JOIN flight_canceled FC ON Q.flightId = FC.flightId
GROUP BY EXTRACT(YEAR_MONTH FROM Q.flightDate), FD.delayId, FC.cancelId
) A LEFT JOIN delaycancel C ON A.cancelId = C.cancelId AND A.delayId = C.delayId
GROUP BY A.flightDate, C.type;

/* Drop view tempview */
DROP VIEW IF EXISTS query;