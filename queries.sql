SELECT R.airTime, R.distance
FROM route R, airport A1, airport A2
WHERE A1.airportId = R.orig AND A2.airportId = R.dest AND A1.airportCode = ? and A2.airportCode = ?;

CREATE OR REPLACE VIEW query AS
SELECT F.*
FROM route R, airport A1, airport A2, flight F
WHERE (
	R.orig = A1.airportId AND
	R.dest = A2.airportId AND
	A1.airportCode = 'IND' AND
	A2.airportCode = 'MSP' AND
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
DROP VIEW IF EXISTS query;