from flask import Flask, request, jsonify
import yfinance as yf

app = Flask(__name__)

@app.route('/get_stock_data', methods=['GET'])
def get_stock_data():
    symbols = request.args.get('symbols')
    
    if not symbols:
        return jsonify({'error': 'No symbols provided'})

    try:
        symbol_list = symbols.split(',')  # Split the comma-separated symbols into a list
        data_list = []

        for symbol in symbol_list:
            stock = yf.Ticker(symbol)
            data = stock.history(period="1d")

            if not data.empty:
                latest_data = data.iloc[-1]
                timestamp = latest_data.name
                price = latest_data['Close']
                volume = latest_data['Volume']

                response_data = {
                    'symbol': symbol,
                    'price': price,
                    'volume': volume,
                }
                data_list.append(response_data)
            else:
                data_list.append({'error': f'Stock data not available for {symbol}'})
                
        return jsonify(data_list)

    except Exception as e:
        return jsonify({'error': f'Error: {e}'})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=7000)
