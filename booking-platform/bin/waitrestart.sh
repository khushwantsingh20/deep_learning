OID=$1
NID=$1

while [[ $OID == $NID ]]; do
    while ! nc -z localhost 8000; do sleep 0.1; done
    NID=$(<./django-root/.pid)
done

