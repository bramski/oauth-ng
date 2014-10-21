'use strict'

describe 'AccessTokenFactory', ->
  fragment = 'access_token=token&token_type=bearer&expires_in=7200&state=/path&extra=stuff'
  denied = 'error=access_denied&error_description=error'
  expires_at = '2014-08-17T17:38:37.584Z'
  token =
    access_token: 'token', token_type: 'bearer', expires_in: 7200, state: '/path', expires_at: expires_at
  $location = localStorageService = subject = {}

  beforeEach module('oauth')

  beforeEach inject( ($injector) ->
    $location       = $injector.get('$location')
    localStorageService = $injector.get('localStorageService')
    subject = $injector.get('AccessTokenFactory')
  )

  describe "#findOrCreate", ->
    instance = null;
    describe 'when the instance does not exist ', ->
      beforeEach ->
        instance = subject.findOrCreate('default')
      it 'makes an instance', ->
        expect( instance ).toBeTruthy()
        expect( instance.clientName()).toEqual('default')

    describe 'when the instance already exists ', ->
      instance2 = null
      instance3 = null
      beforeEach ->
        instance = subject.findOrCreate('default')
        instance.token = {access_token: 'barf'}
        instance2 = subject.findOrCreate('default')
        instance3 = subject.findOrCreate('other')

      it 'does not create instances for the same names', ->
        expect( instance.token ).toEqual(instance2.token)
        expect( instance.token).not.toEqual(instance3.token)
