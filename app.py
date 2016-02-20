import requests


from flask import Flask, request, Response

app = Flask(__name__)


@app.route('/zillow')
def zillow():
    response = requests.get('http://www.zillow.com/search/GetResults.htm?' + request.query_string.decode('ascii'))

    return Response(
        response=response.content,
        status=200,
        mimetype='application/json',
    )


@app.route('/yelp')
def yelp():
    response = requests.get('http://www.yelp.com/search/snippet' + request.query_string.decode('ascii'))

    return Response(
        response=response.content,
        status=200,
        mimetype='application/json',
    )


if __name__ == "__main__":
    app.run(debug=True)
