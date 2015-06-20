
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

SELECT R.airTime, R.distance
FROM route R, airport A1, airport A2
WHERE A1.airportId = R.orig AND A2.airportId = R.dest AND A1.airportCode = 'JFK' and A2.airportCode = 'SFO';

CREATE OR REPLACE VIEW query AS
SELECT F.*
FROM route R, airport A1, airport A2, flight F
WHERE (
	R.orig = A1.airportId AND
	R.dest = A2.airportId AND
	A1.airportCode = 'JFK' AND
	A2.airportCode = 'SFO' AND
	F.routeId = R.routeId
);

SELECT Air.description, A.tot, IFNULL(B.del,0) AS del, IFNULL(C.can,0) AS del, IFNULL(ROUND(B.del*100/A.tot,1),0) AS del_p, IFNULL(ROUND(C.can*100/A.tot,1),0) AS can_p, IFNULL(D.avg,0) AS avg
FROM
	(SELECT Q.airlineId, count(*) AS tot FROM query Q GROUP BY Q.airlineId) A LEFT OUTER JOIN
	(SELECT Q.airlineId, count(*) AS del FROM query Q WHERE EXISTS (SELECT * FROM flight_delayed FD WHERE FD.flightId=Q.flightId) GROUP BY Q.airlineId) B ON A.airlineId = B.airlineId LEFT OUTER JOIN
	(SELECT Q.airlineId, count(*) AS can FROM query Q WHERE EXISTS (SELECT * FROM flight_canceled FC WHERE FC.flightId=Q.flightId) GROUP BY Q.airlineId) C ON A.airlineId = C.airlineId LEFT OUTER JOIN  
	(SELECT Q.airlineId, ROUND(AVG(FD.duration)) AS avg FROM query Q, flight_delayed FD WHERE Q.flightId=FD.flightId GROUP BY Q.airlineId) D ON A.airlineId = D.airlineId LEFT OUTER JOIN
	airline Air ON A.airlineId = Air.airlineId
ORDER BY A.tot DESC;

SELECT Ontime AS type, tot FROM (
SELECT "Ontime", COUNT(*) AS tot
FROM query Q
WHERE NOT EXISTS (SELECT * FROM flight_delayed FD WHERE FD.flightId=Q.flightId) AND NOT EXISTS (SELECT * FROM flight_canceled FC WHERE FC.flightId=Q.flightId)
UNION
SELECT D.type, COUNT(*) AS tot
FROM query Q, delay D, flight_delayed FD
WHERE FD.flightId = Q.flightId AND D.delayId = FD.delayId
GROUP BY D.type
UNION
SELECT "Canceled", count(*) AS tot
FROM query Q
WHERE EXISTS (SELECT * FROM flight_canceled FC WHERE FC.flightId=Q.flightId)
) A;

DROP VIEW IF EXISTS query;