import os

from rest_framework import serializers

from .services import ALLOWED_EXTENSIONS, DELIMITERS, MAX_UPLOAD_SIZE


class ConversionRequestSerializer(serializers.Serializer):
    file = serializers.FileField()
    output_format = serializers.ChoiceField(choices=['xlsx', 'json'], default='xlsx')
    delimiter = serializers.ChoiceField(choices=list(DELIMITERS.keys()), default='comma')
    clean_missing = serializers.BooleanField(default=True)
    trim_columns = serializers.BooleanField(default=True)
    drop_duplicates = serializers.BooleanField(default=False)

    def validate_file(self, value):
        ext = os.path.splitext(value.name)[1].lower()
        if ext not in ALLOWED_EXTENSIONS:
            raise serializers.ValidationError(
                'Hanya berkas dengan ekstensi .csv, .txt, atau .json yang diterima.'
            )
        if value.size > MAX_UPLOAD_SIZE:
            raise serializers.ValidationError('Ukuran berkas melebihi batas maksimal 10 MB.')
        return value
