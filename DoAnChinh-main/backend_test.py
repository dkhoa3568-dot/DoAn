import requests
import sys
import json
from datetime import datetime

class iPhoneStoreAPITester:
    def __init__(self, base_url="https://docker-store.preview.emergentagent.com"):
        self.base_url = base_url
        self.session = requests.Session()
        self.tests_run = 0
        self.tests_passed = 0
        self.admin_token = None
        self.user_token = None
        self.test_product_id = None
        self.test_cart_item_id = None
        self.test_order_id = None

    def log_test(self, name, success, details=""):
        """Log test results"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name} - PASSED")
        else:
            print(f"❌ {name} - FAILED: {details}")
        return success

    def make_request(self, method, endpoint, data=None, headers=None, cookies=None):
        """Make HTTP request with error handling"""
        url = f"{self.base_url}/api/{endpoint}"
        default_headers = {'Content-Type': 'application/json'}
        if headers:
            default_headers.update(headers)
        
        try:
            if method == 'GET':
                response = self.session.get(url, headers=default_headers)
            elif method == 'POST':
                response = self.session.post(url, json=data, headers=default_headers)
            elif method == 'PUT':
                response = self.session.put(url, json=data, headers=default_headers)
            elif method == 'DELETE':
                response = self.session.delete(url, headers=default_headers)
            
            return response
        except Exception as e:
            print(f"Request error: {str(e)}")
            return None

    def test_user_registration(self):
        """Test user registration with email/password"""
        test_email = f"testuser_{datetime.now().strftime('%H%M%S')}@test.com"
        data = {
            "email": test_email,
            "password": "testpass123",
            "name": "Test User"
        }
        
        response = self.make_request('POST', 'auth/register', data)
        if response and response.status_code == 200:
            user_data = response.json()
            return self.log_test("User Registration", 
                               'user_id' in user_data and user_data['email'] == test_email)
        else:
            return self.log_test("User Registration", False, 
                               f"Status: {response.status_code if response else 'No response'}")

    def test_admin_login(self):
        """Test admin login with credentials"""
        data = {
            "email": "admin@iphonestore.com",
            "password": "admin123"
        }
        
        response = self.make_request('POST', 'auth/login', data)
        if response and response.status_code == 200:
            user_data = response.json()
            success = user_data.get('role') == 'admin'
            if success:
                # Store cookies for subsequent requests
                self.session.cookies.update(response.cookies)
            return self.log_test("Admin Login", success)
        else:
            return self.log_test("Admin Login", False, 
                               f"Status: {response.status_code if response else 'No response'}")

    def test_user_login(self):
        """Test regular user login"""
        data = {
            "email": "test@iphonestore.com", 
            "password": "test123"
        }
        
        response = self.make_request('POST', 'auth/login', data)
        if response and response.status_code == 200:
            user_data = response.json()
            success = 'user_id' in user_data
            return self.log_test("User Login", success)
        else:
            return self.log_test("User Login", False,
                               f"Status: {response.status_code if response else 'No response'}")

    def test_get_current_user(self):
        """Test getting current authenticated user"""
        response = self.make_request('GET', 'auth/me')
        if response and response.status_code == 200:
            user_data = response.json()
            return self.log_test("Get Current User", 'user_id' in user_data)
        else:
            return self.log_test("Get Current User", False,
                               f"Status: {response.status_code if response else 'No response'}")

    def test_product_listing(self):
        """Test product listing page shows all iPhones"""
        response = self.make_request('GET', 'products')
        if response and response.status_code == 200:
            products = response.json()
            success = len(products) > 0 and all('product_id' in p for p in products)
            if success and products:
                self.test_product_id = products[0]['product_id']
            return self.log_test("Product Listing", success, 
                               f"Found {len(products)} products")
        else:
            return self.log_test("Product Listing", False,
                               f"Status: {response.status_code if response else 'No response'}")

    def test_get_single_product(self):
        """Test getting single product details"""
        if not self.test_product_id:
            return self.log_test("Get Single Product", False, "No product ID available")
        
        response = self.make_request('GET', f'products/{self.test_product_id}')
        if response and response.status_code == 200:
            product = response.json()
            success = 'variants' in product and len(product['variants']) > 0
            return self.log_test("Get Single Product", success)
        else:
            return self.log_test("Get Single Product", False,
                               f"Status: {response.status_code if response else 'No response'}")

    def test_add_to_cart(self):
        """Test add to cart functionality"""
        if not self.test_product_id:
            return self.log_test("Add to Cart", False, "No product ID available")
        
        data = {
            "product_id": self.test_product_id,
            "variant_index": 0,
            "quantity": 1
        }
        
        response = self.make_request('POST', 'cart', data)
        if response and response.status_code == 200:
            cart_item = response.json()
            success = 'cart_item_id' in cart_item
            if success:
                self.test_cart_item_id = cart_item['cart_item_id']
            return self.log_test("Add to Cart", success)
        else:
            return self.log_test("Add to Cart", False,
                               f"Status: {response.status_code if response else 'No response'}")

    def test_get_cart(self):
        """Test getting shopping cart"""
        response = self.make_request('GET', 'cart')
        if response and response.status_code == 200:
            cart = response.json()
            success = isinstance(cart, list)
            return self.log_test("Get Cart", success, f"Cart has {len(cart)} items")
        else:
            return self.log_test("Get Cart", False,
                               f"Status: {response.status_code if response else 'No response'}")

    def test_update_cart_quantity(self):
        """Test updating cart item quantity"""
        if not self.test_cart_item_id:
            return self.log_test("Update Cart Quantity", False, "No cart item ID available")
        
        response = self.make_request('PUT', f'cart/{self.test_cart_item_id}?quantity=2')
        if response and response.status_code == 200:
            return self.log_test("Update Cart Quantity", True)
        else:
            return self.log_test("Update Cart Quantity", False,
                               f"Status: {response.status_code if response else 'No response'}")

    def test_checkout_creation(self):
        """Test checkout session creation"""
        data = {
            "origin_url": "https://docker-store.preview.emergentagent.com"
        }
        
        response = self.make_request('POST', 'checkout', data)
        if response and response.status_code == 200:
            checkout_data = response.json()
            success = 'url' in checkout_data and 'session_id' in checkout_data
            return self.log_test("Checkout Creation", success)
        else:
            return self.log_test("Checkout Creation", False,
                               f"Status: {response.status_code if response else 'No response'}")

    def test_get_orders(self):
        """Test getting user order history"""
        response = self.make_request('GET', 'orders')
        if response and response.status_code == 200:
            orders = response.json()
            success = isinstance(orders, list)
            return self.log_test("Get Orders", success, f"Found {len(orders)} orders")
        else:
            return self.log_test("Get Orders", False,
                               f"Status: {response.status_code if response else 'No response'}")

    def test_admin_get_all_orders(self):
        """Test admin getting all orders"""
        response = self.make_request('GET', 'admin/orders')
        if response and response.status_code == 200:
            orders = response.json()
            success = isinstance(orders, list)
            if success and orders:
                self.test_order_id = orders[0]['order_id']
            return self.log_test("Admin Get All Orders", success, f"Found {len(orders)} orders")
        else:
            return self.log_test("Admin Get All Orders", False,
                               f"Status: {response.status_code if response else 'No response'}")

    def test_admin_update_order_status(self):
        """Test admin updating order status"""
        if not self.test_order_id:
            return self.log_test("Admin Update Order Status", False, "No order ID available")
        
        response = self.make_request('PUT', f'admin/orders/{self.test_order_id}/status?status=shipped')
        if response and response.status_code == 200:
            return self.log_test("Admin Update Order Status", True)
        else:
            return self.log_test("Admin Update Order Status", False,
                               f"Status: {response.status_code if response else 'No response'}")

    def test_remove_from_cart(self):
        """Test removing item from cart"""
        if not self.test_cart_item_id:
            return self.log_test("Remove from Cart", False, "No cart item ID available")
        
        response = self.make_request('DELETE', f'cart/{self.test_cart_item_id}')
        if response and response.status_code == 200:
            return self.log_test("Remove from Cart", True)
        else:
            return self.log_test("Remove from Cart", False,
                               f"Status: {response.status_code if response else 'No response'}")

    def test_logout(self):
        """Test user logout"""
        response = self.make_request('POST', 'auth/logout')
        if response and response.status_code == 200:
            return self.log_test("Logout", True)
        else:
            return self.log_test("Logout", False,
                               f"Status: {response.status_code if response else 'No response'}")

def main():
    print("🧪 Starting iPhone Store API Tests...")
    print("=" * 50)
    
    tester = iPhoneStoreAPITester()
    
    # Test sequence
    tests = [
        # Authentication tests
        tester.test_user_registration,
        tester.test_admin_login,
        tester.test_get_current_user,
        
        # Product tests
        tester.test_product_listing,
        tester.test_get_single_product,
        
        # Cart tests
        tester.test_add_to_cart,
        tester.test_get_cart,
        tester.test_update_cart_quantity,
        
        # Checkout tests
        tester.test_checkout_creation,
        
        # Order tests
        tester.test_get_orders,
        
        # Admin tests
        tester.test_admin_get_all_orders,
        tester.test_admin_update_order_status,
        
        # Cleanup tests
        tester.test_remove_from_cart,
        
        # Test user login separately
        tester.test_user_login,
        tester.test_logout,
    ]
    
    # Run all tests
    for test in tests:
        try:
            test()
        except Exception as e:
            print(f"❌ {test.__name__} - ERROR: {str(e)}")
            tester.tests_run += 1
    
    # Print summary
    print("\n" + "=" * 50)
    print(f"📊 Test Results: {tester.tests_passed}/{tester.tests_run} passed")
    success_rate = (tester.tests_passed / tester.tests_run * 100) if tester.tests_run > 0 else 0
    print(f"📈 Success Rate: {success_rate:.1f}%")
    
    if success_rate < 70:
        print("⚠️  Many tests failed - backend may have issues")
        return 1
    elif success_rate < 90:
        print("⚠️  Some tests failed - minor backend issues")
        return 0
    else:
        print("✅ Most tests passed - backend looks good")
        return 0

if __name__ == "__main__":
    sys.exit(main())