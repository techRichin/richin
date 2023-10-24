import yfinance as yf

def get_stock_symbol(company_name):
    try:
        search_result = yf.Ticker(company_name)
        stock_symbol = search_result.info['symbol']
        return stock_symbol
    except Exception as e:
        print(f"An error occurred: {e}")
        return None

company_name = "Apple Inc."  # Replace with the company name you want to search for
stock_symbol = get_stock_symbol("TCS")

if stock_symbol:
    print(f"Stock Symbol for {company_name}: {stock_symbol}")
else:
    print("Symbol not found or an error occurred.")
