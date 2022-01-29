import serial
import time
import requests

# bluetooth parameters
bt_port = '/dev/rfcomm0'
baud_rate = 9600

# http parameters
base_path = 'localhost:3030/api'
bind_path = base_path + '/bind-device'
new_code_path = base_path + '/add-new-code'


def bind_device(bt):
    dev_id_bytes = bt.readln()
    pub_k_bytes = bt.read(32)
    dev_id = dev_id_bytes.decode()
    pub_k = pub_k_bytes.hex()

    print('Device id:', dev_id)
    print('Public key:', pub_k)

    res = requests.post(bind_path, json={'deviceId': dev_id, 'pk': pub_k})
    if res.status_code == 200:
        print('Successfully bound device')
        data = res.json()
        bt.write(str(data['username']).encode())
    else:
        print('Error during binding device')


def create_code(bt):
    username_bytes = bt.readline()
    hash_bytes = bt.read(32)
    sign_bytes = bt.read(64)
    username = username_bytes.decode()
    hash_code = hash_bytes.hex()
    sign = sign_bytes.hex()

    print('Username:', username)
    print('Hash code:', hash_code)
    print('Sign:', sign)

    res = requests.post(new_code_path, json={'username': username, 'hashCode': hash_code, 'sign': sign})
    if res.status_code == 200:
        print('Successfully added code')
    else:
        print('Error during creating new code')


if __name__ == '__main__':
    with serial.Serial(bt_port, baud_rate) as bt:
        is_dev_bound = False
        while True:
            if is_dev_bound:
                create_code(bt)
            else:
                bind_device(bt)
                is_dev_bound = True
            time.sleep(1)