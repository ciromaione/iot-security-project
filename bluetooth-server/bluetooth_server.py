import serial
import time
import requests

# bluetooth parameters
bt_port = '/dev/rfcomm0'
baud_rate = 9600

# http parameters
base_path = 'http://localhost:3030/api'
bind_path = base_path + '/finalize-binding'
new_code_path = base_path + '/add-new-code'

username = ''


def bind_device(bt):
    dev_id_bytes = bt.readline()
    nonce_bytes = bt.readline()
    pub_k_bytes = bt.read(32)

    dev_id = dev_id_bytes.decode().strip()
    nonce = nonce_bytes.decode().strip()
    pub_k = pub_k_bytes.hex()

    print('Device id:', dev_id)
    print('Nonce:', nonce)
    print('Public key:', pub_k)

    res = requests.post(bind_path, json={'deviceId': dev_id, 'nonce': nonce , 'pk': pub_k})
    if res.status_code == 200:
        print('Successfully bound device')
    else:
        print('Error during binding device')
        print(res.reason)


def create_code(bt):
    dev_id_bytes = bt.readline()
    hash_bytes = bt.read(32)
    sign_bytes = bt.read(64)

    dev_id = dev_id_bytes.decode().strip()
    hash_code = hash_bytes.hex()
    sign = sign_bytes.hex()

    print('Device id:', dev_id)
    print('Hash code:', hash_code)
    print('Sign:', sign)

    res = requests.post(new_code_path, json={'devId': dev_id, 'hashCode': hash_code, 'sign': sign})
    if res.status_code == 200:
        print('Successfully added code')
    else:
        print('Error during creating new code')
        print(res.reason)


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
