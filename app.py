import flask
import flask_assets
import logging
import requests

logger = logging.getLogger('apartment-search')
logging.basicConfig(level=logging.DEBUG)

bundles = {
    'app_js': flask_assets.Bundle(
        'js/bootstrap.js',
        'apartment-search.js',
        output='bundles/app.js',
    ),
    'app_css': flask_assets.Bundle(
        'css/bootstrap.css',
        'apartment-search.css',
        output='bundles/app.css',
    )
}

app = flask.Flask(__name__)
assets = flask_assets.Environment(app)
assets.register(bundles)


def _make_request(url):
    query = flask.request.args
    logger.info('api call: %s [%s]' % (url, query))
    response = requests.get(url, query)
    data = response.json()
    return data


@app.route('/zillow')
def zillow():
    zillow_url = 'http://www.zillow.com/search/GetResults.htm'

    response = _make_request(zillow_url, headers={
        'Cookie':
    })

    return flask.jsonify(response)


@app.route('/yelp')
def yelp():
    yelp_url = 'http://www.yelp.com/search/snippet'

    response = _make_request(yelp_url)

    return flask.jsonify(response)


@app.route('/')
def home():
    return flask.render_template('index.html')


if __name__ == "__main__":
    app.run(debug=True)
